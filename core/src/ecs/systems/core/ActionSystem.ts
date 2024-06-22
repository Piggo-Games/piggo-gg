import { Noob, SystemBuilder, entries } from "@piggo-gg/core";

export const ActionSystem: SystemBuilder<"ActionSystem"> = {
  id: "ActionSystem",
  init: (world) => ({
    id: "ActionSystem",
    query: [],
    onTick: () => {
      const actionsAtTick = world.actionBuffer.atTick(world.tick);
      if (!actionsAtTick) return;

      entries(actionsAtTick).forEach(([entityId, actions]) => {

        // handle commands
        if (entityId === "world") {
          actions.forEach((invokedAction) => {
            const command = world.commands[invokedAction.action];

            const player = invokedAction.playerId ? world.entities[invokedAction.playerId] as Noob : undefined;
            if (command) command.invoke({ params: invokedAction.params ?? {}, world, player });
          });
        }

        // handle actions
        if (actions) actions.forEach((invokedAction) => {
          const entity = world.entities[entityId];

          // entity not found
          if (!entity) return;

          // entity has no actions
          const actions = entity.components.actions;
          if (!actions) {
            console.log(`集 ${entityId} has no actions`);
            return;
          }

          // find the action
          const action = actions.actionMap[invokedAction.action];

          // action not found
          if (!action) {
            console.log(`action ${invokedAction} not found`);
            return;
          }

          // execute the action
          const player = invokedAction.playerId ? world.entities[invokedAction.playerId] as Noob : undefined;
          action.invoke({ params: invokedAction.params ?? {}, entity, world, player });
        });
      });
    }
  })
}
