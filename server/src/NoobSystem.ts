import { Entity, PC, SystemBuilder } from "@piggo-gg/core"

// modifies the names of noobs
export const NoobSystem = SystemBuilder({
  id: "NoobSystem",
  init: () => {

    const seen = new Set<string>()

    return {
      id: "NoobSystem",
      query: ["pc"],
      priority: 5,
      onTick: (entities: Entity<PC>[]) => {
        for (const entity of entities) {
          const { pc } = entity.components

          if (!seen.has(entity.id) && pc.data.name === "noob") {
            seen.add(entity.id)

            if (seen.size > 1) {
              pc.data.name = `noob${seen.size - 1}`
            }
          }
        }
      }
    }
  }
})
