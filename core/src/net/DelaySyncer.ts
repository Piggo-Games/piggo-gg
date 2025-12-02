import {
  Entity, GameData, Player, SerializedEntity,
  Syncer, Apple, entries, keys, stringify, logDiff
} from "@piggo-gg/core"
import { Bot } from "../games/volley/Bot"

export const entityConstructors: Record<string, (_: { id?: string }) => Entity> = {
  "player": Player,
  "d3apple": Apple,
  "bot": ({ id }: { id: string }) => {
    const x = Number(id.split("|")[1])
    const y = Number(id.split("|")[2])
    return Bot(1, { x, y })
  }
}

export const DelaySyncer = (): Syncer => ({
  write: (world) => {

    const message: GameData = {
      actions: world.actions.fromTick(world.tick + 1),
      chats: world.messages.atTick(world.tick) ?? {},
      game: world.game.id,
      playerId: world.client?.playerId() ?? "",
      serializedEntities: {},
      tick: world.tick + 1,
      timestamp: Date.now(),
      type: "game"
    }

    world.actions.clearTick(world.tick + 1)
    return message
  },
  read: ({ world, buffer }) => {

    const message = buffer.shift() as GameData

    if (!(message.tick > world.game.started)) return

    // remove old local entities
    keys(world.entities).forEach((entityId) => {
      if (world.entities[entityId]?.components.networked) {

        if (!message.serializedEntities[entityId] && message.game === world.game.id) {
          console.log("DELETE ENTITY", entityId)
          world.removeEntity(entityId)
        }
      }
    })

    // add new entities from remote
    keys(message.serializedEntities).forEach((entityId) => {
      if (!world.entities[entityId]) {
        const entityKind = entityId.split("-")[0]
        const constructor = entityConstructors[entityKind]
        if (constructor !== undefined) {
          console.log("ADD ENTITY", entityId)
          world.addEntity(constructor({ id: entityId }))
        } else {
          console.error("UNKNOWN ENTITY ON SERVER", entityId)
        }
      }
    })

    let rollback = false

    const mustRollback = (reason: string) => {
      console.log(`MUST ROLLBACK tick:${world.tick}`, reason)
      rollback = true
    }

    if (message.tick !== world.tick) {
      mustRollback(`old tick msg:${message.tick}`)
    }

    const localEntities: Record<string, SerializedEntity> = {}
    for (const entityId in world.entities) {
      if (world.entities[entityId].components.networked) {
        localEntities[entityId] = world.entities[entityId].serialize()
      }
    }

    // compare entity counts
    if (!rollback) {
      const numLocal = keys(localEntities).length
      const numRemote = keys(message.serializedEntities).length
      if (numLocal !== numRemote) mustRollback(`entity count local:${numLocal} remote:${numRemote} remote:${message.tick}`)
    }

    // compare entity states
    if (!rollback) {
      for (const [entityId, msgEntity] of entries(message.serializedEntities)) {
        const localEntity = localEntities[entityId]
        if (localEntity) {
          if (stringify(localEntity) !== stringify(msgEntity)) {
            mustRollback(`entity: ${entityId} mismatch ${message.tick}`)
            logDiff(localEntity, msgEntity)
            break
          }
        } else {
          mustRollback(`no buffered message ${localEntities.serializedEntities}`)
        }
      }
    }

    if (rollback) {
      world.tick = message.tick

      if (message.game !== world.game.id) {
        world.setGame(message.game)
      }

      keys(message.serializedEntities).forEach((entityId) => {
        if (world.entities[entityId]) {
          world.entities[entityId].deserialize(message.serializedEntities[entityId])
        }
      })
    }

    // set actions
    entries(message.actions).forEach(([tick, actions]) => {
      entries(actions).forEach(([entityId, actions]) => {
        actions.forEach((action) => {
          world.actions.push(Number(tick), entityId, action)
        })
      })
    })
  }
})
