import {
  ClientSystemBuilder, Entity, Health, Position, Renderable, entries, load, pixiText
} from "@piggo-gg/core"
import { Sprite } from "pixi.js"

// the HeartsSystem draws hearts above characters with Health
export const HeartsSystem = () => ClientSystemBuilder({
  id: "HeartsSystem",
  init: (world) => {

    const hearts: Record<string, Entity> = {}

    return {
      id: "HeartsSystem",
      query: ["health", "position"],
      priority: 6,
      skipOnRollback: true,
      onTick: (entities: Entity<Health | Position>[]) => {

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

export const Heart = (entity: Entity<Health | Position>): Entity => {
  const entityId = entity.id
  const position = Position({ follows: entityId, offset: { x: 0, y: -24 } })

  let hpText: ReturnType<typeof pixiText> | null = null

  return Entity<Position | Renderable>({
    id: `heart-${entityId}`,
    components: {
      position,
      renderable: Renderable({
        zIndex: 9,
        interpolate: true,
        scaleMode: "nearest",
        scale: 1,
        onTick: ({ renderable, world }) => {
          const target = world.entity(entityId)

          if (!target || !target.components.health) {
            renderable.visible = false
            return
          }

          const { health, renderable: targetRenderable } = target.components

          renderable.visible = targetRenderable?.visible ?? true

          if (hpText) hpText.text = `${health.data.hp}`

          if (targetRenderable?.initialized) {
            const bounds = targetRenderable.c.getLocalBounds()
            if (bounds.height > 0) {
              const desiredOffset = -(bounds.height * 0.6)

              if (Math.abs(position.data.offset.y - desiredOffset) > 0.5) {
                position.data.offset.y = desiredOffset
              }
            }
          }
        },
        setup: async (r) => {
          const t = await load("heart.png")
          const heartSprite = new Sprite(t)

          hpText = pixiText({
            text: ``,
            pos: { x: -22, y: 0 },
            anchor: { x: 0, y: 0.3 },
            style: { fontSize: 8, dropShadow: true, resolution: 4 }
          })

          r.c = heartSprite
          r.c.addChild(hpText)
        }
      })
    }
  })
}
