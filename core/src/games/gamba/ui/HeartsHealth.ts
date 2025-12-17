import {
  ClientSystemBuilder, Entity, Health, Position, Renderable, entries, load,
  min
} from "@piggo-gg/core"
import { Sprite, Texture } from "pixi.js"

// the HeartsSystem draws hearts above characters with Health
export const HeartsSystem = () => ClientSystemBuilder({
  id: "HeartsSystem",
  init: (world) => {

    const hearts: Record<string, Entity> = {}

    return {
      id: "HeartsSystem",
      query: ["health", "position", "renderable"],
      priority: 6,
      skipOnRollback: true,
      onTick: (entities: Entity<Health | Position | Renderable>[]) => {

        // clean up missing entities
        for (const [entityId, heart] of entries(hearts)) {
          const heartEntity = world.entity(heart.id)
          if (!heartEntity || heartEntity.removed) {
            delete hearts[entityId]
            continue
          }

          const target = world.entity(entityId)

          if (!target || !target.components.health || target.components.health.showHealthBar === false || target.removed) {
            world.removeEntity(heart.id)
            delete hearts[entityId]
          }
        }

        for (const entity of entities) {
          const { health } = entity.components
          if (!health || health.showHealthBar === false) continue

          if (!hearts[entity.id]) {
            const heart = Heart(entity)
            hearts[entity.id] = heart
            world.addEntity(heart)
          }
        }
      }
    }
  }
})

export const Heart = (target: Entity<Health | Position | Renderable>): Entity => {

  let texture: undefined | Texture = undefined
  let numHearts = 0

  return Entity<Position | Renderable>({
    id: `heart-${target.id}`,
    components: {
      position: Position({ follows: target.id }),
      renderable: Renderable({
        zIndex: target.components.renderable.zIndex,
        interpolate: true,
        position: { x: -20, y: 8 },
        onTick: ({ renderable }) => {
          renderable.visible = target.components.renderable?.visible ?? false
          if (!renderable.visible) return

          const { hp } = target.components.health.data
          if (hp === numHearts || !texture) return
          numHearts = hp

          renderable.c.removeChildren()

          let row = 0
          while (numHearts > row * 10) {
            const numThisRow = min(10, numHearts - row * 10)
            console.log("numThisRow", numThisRow, target.id)

            const gap = numThisRow === 5 ? 8 : 3.5

            for (let i = 0; i < numThisRow; i++) {
              renderable.c.addChild(new Sprite({
                texture,
                scale: { x: 0.9, y: 0.9 },
                x: i * gap,
                y: row * 8
              }))
            }
            row++
          }
        },
        setup: async (r) => {
          texture = await load("heart.png")
          texture.source.scaleMode = "nearest"
        }
      })
    }
  })
}
