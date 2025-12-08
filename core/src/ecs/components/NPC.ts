import { Component, Entity, InvokedAction, SystemBuilder, World } from "@piggo-gg/core"

export type NPC = Component<"npc"> & {
  behavior: (entity: Entity<NPC>, world: World) => InvokedAction | null | void
}

export type NPCProps<T extends string> = {
  behavior: (entity: Entity<NPC>, world: World) => InvokedAction<T> | null | void
}

export const NPC = <T extends string>(props: NPCProps<T>): NPC => ({
  type: "npc",
  behavior: props.behavior
})

export const NPCSystem: SystemBuilder<"NPCSystem"> = {
  id: "NPCSystem",
  init: (world) => ({
    id: "NPCSystem",
    query: ["npc"],
    priority: 6,
    onTick: (entities: Entity<NPC>[]) => {
      entities.forEach((entity) => {
        const action = entity.components.npc.behavior(entity, world)
        if (action) {
          world.actions.push(world.tick, entity.id, action)
        }
      })
    }
  })
}
