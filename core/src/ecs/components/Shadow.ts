import {
  ClientSystemBuilder, Entity, pixiGraphics, Position, Renderable, Component, entries
} from "@piggo-gg/core"

export type Shadow = Component<"shadow"> & { size: number, yOffset: number, xOffset: number }

export const Shadow = (size: number, yOffset: number = 0, xOffset: number = 0): Shadow => ({
  type: "shadow", size, yOffset, xOffset
})

type Target = Entity<Position | Renderable | Shadow>

export const ShadowSystem = ClientSystemBuilder({
  id: "ShadowSystem",
  init: (world) => {

    const shadows: Record<string, Entity<Renderable>> = {}
    const targets: Record<string, Target> = {}

    return {
      id: "ShadowSystem",
      query: ["shadow", "position", "renderable"],
      priority: 5,
      onTick: (entities: Target[]) => {

        // clean up
        for (const [id, shadow] of entries(shadows)) {
          if (!entities.find(e => e.id === id)) {
            world.removeEntity(shadow.id)
            delete shadows[id]
            delete targets[id]
          }
        }

        for (const [id, target] of entries(targets)) {
          if (target.removed) {
            world.removeEntity(shadows[id].id)
            delete targets[id]
            delete shadows[id]
          }
        }

        // create shadows
        for (const target of entities) {
          if (!shadows[target.id]) {
            const { size, yOffset, xOffset } = target.components.shadow
            const shadowEntity = ShadowEntity(target, size, yOffset, xOffset)

            shadows[target.id] = shadowEntity
            targets[target.id] = target

            world.addEntity(shadowEntity)
          }
        }
      }
    }
  }
})

const ShadowEntity = (target: Target, size: number, yOffset: number, xOffset: number) => Entity<Renderable>({
  id: `shadow-${target.id}`,
  components: {
    position: Position(),
    renderable: Renderable({
      zIndex: target.components.renderable.zIndex - 1,
      interpolate: true,
      onTick: ({ entity }) => {
        const { position, renderable } = entity.components
        if (!position || !renderable) return

        const { data: pos, lastCollided, localVelocity } = target.components.position

        position.setPosition({ x: pos.x + xOffset, y: pos.y - 0.1 + yOffset, z: 0 })
        position.setVelocity({ ...pos.velocity, z: 0 })

        position.localVelocity = { ...localVelocity, z: 0 }
        position.lastCollided = lastCollided

        renderable.c.alpha = 0.3 - pos.z / 500
        renderable.visible = target.components.renderable.visible
      },
      setup: async (renderable) => {
        renderable.c = pixiGraphics().ellipse(0, 1, size * 2, size).fill({ color: 0x000000, alpha: 1 })
        renderable.setBlur({ strength: 3 })
      }
    })
  }
})
