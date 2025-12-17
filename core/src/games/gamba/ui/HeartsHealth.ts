import {
  ClientSystemBuilder, Entity, Health, Position, Renderable, entries, load
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

export const Heart = (entity: Entity<Health | Position | Renderable>): Entity => {
  const entityId = entity.id

  let texture: undefined | Texture = undefined
  let numHearts = 5

  return Entity<Position | Renderable>({
    id: `heart-${entityId}`,
    components: {
      position: Position({ follows: entityId }),
      renderable: Renderable({
        zIndex: entity.components.renderable.zIndex,
        interpolate: true,
        position: { x: -20, y: entityId.startsWith("gary") ? 8 : 8 },
        onTick: ({ renderable, world }) => {
          const target = world.entity(entityId)

          if (!target || !target.components.health) {
            renderable.visible = false
            return
          }

          renderable.visible = target.components.renderable?.visible ?? false

          // LOGIC FOR UPDATING HEARTS GOES HERE
          const { hp } = target.components.health.data
          if (hp === numHearts || !texture) return

          numHearts = hp

          renderable.c.removeChildren()

          for (let i = 0; i < hp; i++) {
            const copy = new Sprite({ texture, scale: { x: 0.9, y: 0.9 } })
            copy.x = i * 8
            renderable.c.addChild(copy)
          }
        },
        setup: async (r) => {
          texture = await load("heart.png")
          texture.source.scaleMode = "nearest"

          // TODO
          for (let i = 0; i < 5; i++) {
            const copy = new Sprite({ texture, scale: { x: 0.9, y: 0.9 } })
            copy.x = i * 8
            r.c.addChild(copy)
          }
        }
      })
    }
  })
}
