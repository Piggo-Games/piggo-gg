import { Entity, Player, SystemBuilder, entries, keys, stringify, Position, Character } from "@piggo-gg/core"

export const ActionSystem: SystemBuilder<"ActionSystem"> = {
  id: "ActionSystem",
  init: (world) => ({
    id: "ActionSystem",
    query: ["position"],
    priority: 8,
    onTick: (entities: Entity<Position>[]) => {

      for (const entity of entities) {
        const { position } = entity.components
        if (position.data.velocityResets && !position.data.heading.x && !position.data.heading.y) {
          position.data.velocity.x = 0
          position.data.velocity.y = 0
        }
      }

      const actionsAtTick = world.actions.atTick(world.tick)
      if (!actionsAtTick) return

      for ( const [entityId, actions] of entries(actionsAtTick)) {

        // commands
        if (entityId === "world") {
          actions.forEach((invokedAction) => {
            const command = world.commands[invokedAction.actionId]

            const player = invokedAction.playerId ? world.entity(invokedAction.playerId) as Player : undefined
            if (command) command.invoke({ params: invokedAction.params ?? {}, world, player })
          })
          return
        }

        // actions
        actions.sort((a, b) => a.actionId.localeCompare(b.actionId))
        for (const invokedAction of actions) {
          const entity = world.entity(entityId)

          // entity not found
          if (!entity) {
            console.log(`entity ${entityId} not found for action ${invokedAction.actionId}`)
            continue
          }

          // entity has no actions
          const actions = entity.components.actions
          if (!actions) {
            console.log(`${entityId} has no actions`)
            continue
          }

          // find the action
          const action = actions.actionMap[invokedAction.actionId]

          // action not found
          if (!action) {
            console.log(`action ${stringify(invokedAction)} not found in actionMap ${keys(actions.actionMap)}`)
            continue
          }

          // execute the action
          const player = invokedAction.playerId ? world.entity(invokedAction.playerId) as Player : undefined
          const character = invokedAction.characterId ? world.entity(invokedAction.characterId) as Character : undefined
          action.invoke({ params: invokedAction.params ?? {}, entity, world, player, character, offline: invokedAction.offline ?? false } )
        }
      }
    }
  })
}
