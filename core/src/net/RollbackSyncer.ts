import {
  ceil, entityConstructors, entries, GameData, InvokedAction, keys,
  logDiff, stringify, Syncer, values, World
} from "@piggo-gg/core"

const movementActions = ["move", "moveAnalog", "jump", "point", "shoot"]

const otherCharacter = (id: string, world: World) => {
  if (id === world.client?.character()?.id) return false
  if (id.startsWith("carl") || id.startsWith("vince") || id.startsWith("sarge")) return true
  return false
}

const otherPlayer = (actions: InvokedAction[], world: World) => {
  for (const action of actions) {
    if (action.playerId && action.playerId !== world.client?.playerId()) {
      return true
    }
  }
  return false
}

// TODO not generic across games
export const RollbackSyncer = (world: World): Syncer => {

  let last = 0
  let rollback = false

  const mustRollback = (reason: string) => {
    console.log(`MUST ROLLBACK world:${world.tick}`, reason)
    rollback = true
  }

  // find latest actions for other players' characters
  const handleOtherPlayers = (message: GameData) => {

    // movement
    if (message.actions[message.tick]) {
      for (const [entityId, actions] of entries(message.actions[message.tick])) {

        if (otherCharacter(entityId, world) || otherPlayer(actions, world)) {
          for (const action of actions) {
            if (movementActions.includes(action.actionId)) {
              world.actions.push(world.tick, entityId, { ...action, offline: true })
            }
          }
          continue
        }
      }
    }

    // non-movement
    for (const [tick, actionSet] of entries(message.actions)) {
      for (const [entityId, actions] of entries(actionSet)) {
        if (otherCharacter(entityId, world)) {
          for (const action of actions) {
            if (!movementActions.includes(action.actionId)) {
              const pushed = world.actions.push(Number(tick), entityId, { ...action, offline: true })
              if (pushed) mustRollback(`non-movement action tick:${tick} id:${action.actionId}`)
            }
          }
        }
      }
    }

    // deserialize entities
    keys(message.serializedEntities).forEach((entityId) => {
      if (otherCharacter(entityId, world)) {
        world.entity(entityId)?.deserialize(message.serializedEntities[entityId])
      }
    })
  }

  // pre-read message to consume buffer faster
  const preRead = (message: GameData) => {
    handleOtherPlayers(message)

    if (message.actions[message.tick]) {
      for (const [entityId, actions] of entries(message.actions[message.tick])) {
        if (otherCharacter(entityId, world) || otherPlayer(actions, world)) {
          continue
        }
        world.actions.set(message.tick, entityId, actions)
      }
    }
  }

  return {
    write: (world) => ({
      actions: world.actions.fromTick(world.tick, s => s.offline !== true),
      chats: world.messages.atTick(world.tick) ?? {},
      game: world.game.id,
      playerId: world.client?.playerId() ?? "",
      serializedEntities: {},
      tick: world.tick,
      timestamp: Date.now(),
      type: "game"
    }),
    read: ({ world, buffer }) => {
      rollback = false

      // get oldest message
      let message = buffer.sort((a, b) => a.tick - b.tick).shift()

      if (!message) {
        console.error("NO MESSAGE")
        return
      }

      // consume buffer
      if (buffer.length > 1) {
        preRead(message)
        message = buffer.shift() as GameData
      }

      if ((message.diff ?? 1) > 3) {
        console.log("speed up")
        world.tickrate = 30
      } else if ((message.diff ?? 2) < 2) {
        console.log("slow down")
        world.tickrate = 20
      } else {
        world.tickrate = 25
      }

      if (message.tick <= last) {
        console.error(`OUT OF ORDER last:${last} msg:${message.tick} client${world.client?.lastMessageTick}`)
        last = message.tick
        return
      }

      if (!(message.tick > world.game.started)) return

      last = message.tick

      const gap = world.tick - message.tick
      const framesForward = (gap >= 2 && gap <= 5) ?
        gap :
        ceil(world.client!.net.ms * 2 / world.tickrate) + 2

      const localActions = world.actions.atTick(message.tick) ?? {}

      handleOtherPlayers(message)

      // check actions
      if (message.actions[message.tick]) {
        for (const [entityId, actions] of entries(message.actions[message.tick])) {

          if (otherCharacter(entityId, world) || otherPlayer(actions, world)) {
            continue
          }

          if (!localActions[entityId]) {
            mustRollback(`no actions locally for entity:${entityId} action:${actions[0].actionId}`)
            break
          }

          // check local has each action
          for (const action of actions) {
            if (localActions[entityId].find((a) => a.actionId === action.actionId) === undefined) {
              mustRollback(`action not found locally entity:${entityId} action:${action.actionId}`)
              break
            }
          }

          // check remote has each action
          for (const action of localActions[entityId]) {
            if (actions.find((a) => a.actionId === action.actionId) === undefined) {
              mustRollback(`action not found remotely entity:${entityId} action:${action.actionId}`)
              break
            }
          }
        }
      }

      // check entity states
      const local = world.entitiesAtTick[message.tick]
      const remote = message.serializedEntities

      if (!local) {
        mustRollback("no entities locally")
      } else if (keys(local).length !== keys(remote).length) {
        mustRollback(`entity count mismatch ${keys(local).length} ${keys(remote).length}`)
        rollback = true
      }

      if (!rollback) {
        for (const [entityId, serializedEntity] of entries(remote)) {
          if (otherCharacter(entityId, world)) {
            continue
          }

          if (local[entityId]) {
            if (stringify(local[entityId]) !== stringify(serializedEntity)) {
              mustRollback(`entity: ${entityId} mismatch ${message.tick}`)
              logDiff(local[entityId], serializedEntity)
              continue
            }
          }
        }
      }

      // rollback
      if (rollback && message.tick > world.game.started) {
        const was = world.tick

        if (message.game !== world.game.id && message.tick > world.game.started) {
          world.setGame(message.game)
        }

        world.tick = message.tick - 1

        let added = 0
        let removed = 0

        // sync entities
        keys(message.serializedEntities).forEach((entityId) => {

          // ignore other players' characters
          if (otherCharacter(entityId, world)) {
            return
          }

          if (!world.entities[entityId]) {
            const entityKind = entityId.split("-")[0]
            const constructor = entityConstructors[entityKind]
            if (constructor !== undefined) {
              added += 1
              // console.log("ADD ENTITY", entityId)
              world.addEntity(constructor({ id: entityId }))
              world.entity(entityId)?.deserialize(message.serializedEntities[entityId])
            } else {
              console.error("UNKNOWN ENTITY ON SERVER", entityId)
            }
          } else {
            world.entity(entityId)?.deserialize(message.serializedEntities[entityId])
          }
        })

        // rm dangling local entities
        for (const [entityId, entity] of entries(world.entities)) {
          if (entity.components.networked) {
            if (!message.serializedEntities[entityId]) {
              // console.log("REMOVE ENTITY", entityId)
              world.removeEntity(entityId)
              removed += 1
            }
          }
        }

        if (added || removed) console.log(`tick:${world.tick} ADDED:${added} REMOVED:${removed}`)

        // set actions
        if (message.actions[message.tick]) {
          entries(message.actions[message.tick]).forEach(([entityId, actions]) => {
            if (otherCharacter(entityId, world)) {
              return
            }
            world.actions.set(message.tick, entityId, actions)
          })
        }

        values(world.systems).forEach((system) => {
          system.onRollback?.()
        })

        // roll forward
        for (let i = 0; i < framesForward; i++) {
          world.onTick({ isRollback: true })
        }

        world.tick += 1

        handleOtherPlayers(message)

        world.entitiesAtTick[world.tick] = {}
        for (const entityId in world.entities) {
          if (world.entities[entityId].components.networked) {
            world.entitiesAtTick[world.tick][entityId] = world.entities[entityId].serialize()
          }
        }

        // set serialized entities
        world.entitiesAtTick[message.tick] = {
          ...message.serializedEntities
        }

        buffer = []

        console.log(`rollback was:${was} msg:${message.tick} forward:${framesForward} end:${world.tick}`)
      }
    }
  }
}
