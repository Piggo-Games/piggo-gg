import {
  abs,
  Actions, Collider, cos, Effects, Input, Item, ItemBuilder, ItemEntity,
  loadTexture, max, min, Networked, NPC, PI, Position, positionDelta, Renderable,
  Shadow, sign,
  sin
} from "@piggo-gg/core"
import { Sprite } from "pixi.js"

export const Dice: ItemBuilder = ({ character }) => {

  let rolling = false
  let bounced = 0

  const dice = ItemEntity({
    id: `dice`,
    components: {
      networked: Networked(),
      collider: Collider({ shape: "ball", radius: 4, group: "1" }),
      position: Position({ follows: character.id, gravity: 0.04 }),
      item: Item({ name: "Dice" }),
      input: Input({
        press: {
          mb1: ({ world, hold, entity }) => {
            if (hold) return
            const { pointingDelta } = character.components.position.data
            return { actionId: "roll", params: { entityId: entity, pointingDelta } }
          }
        }
      }),
      shadow: Shadow(3, 6),
      actions: Actions({
        roll: ({ params }) => {
          if (!rolling && !dice.components.position.data.follows) {
            dice.components.position.data.follows = character.id
            return
          }

          rolling = true

          dice.components.position.data.z = 0.01

          const { pointingDelta } = params

          const xRatio = pointingDelta.x / (abs(pointingDelta.y) + abs(pointingDelta.x))
          const yRatio = pointingDelta.y / (abs(pointingDelta.y) + abs(pointingDelta.x))

          const x = 150 * xRatio
          const y = 150 * yRatio

          dice.components.position.setVelocity({
            x, y, z: 1,
          })
          dice.components.position.data.follows = null
        }
      }),
      npc: NPC({
        behavior: () => {
          const { position } = dice.components

          const grounded = position.data.z <= 0

          if (rolling && grounded && bounced < 2) {
            bounced += 1
            position.setVelocity({ z: 0.8 / bounced })
          }

          const factor = (position.data.z <= 0 && bounced >= 2) ? 0.95 : 0.99
          position.scaleVelocity(factor, 12)
        }
      }),
      effects: Effects(),
      renderable: Renderable({
        scaleMode: "nearest",
        zIndex: 4,
        scale: 1,
        anchor: { x: 0.5, y: 0.5 },
        interpolate: true,
        rotates: true,
        onRender: () => {
          if (rolling) {
            const { position } = dice.components

            const factor = position.data.velocity.x + position.data.velocity.y

            // if slow, stop flat
            if (factor < 40) {

              const flat = position.data.rotation % (PI / 2)
              const flatCycle = position.data.rotation / (PI / 2)

              if (flat > 0.02) {
                position.rotate(max(0.02, flat * 0.001))
                const curCycle = position.data.rotation / (PI / 2)
                if (flatCycle !== curCycle) {
                  position.data.rotation = curCycle * (PI / 2)
                }
              } else {
                rolling = false
              }
              return
            }
            position.rotate(min(0.1, factor * 0.001))
          }
        },
        setup: async (r: Renderable) => {
          const textures = await loadTexture(`dice.json`)

          r.c = new Sprite(textures["0"])
        }
      })
    }
  })
  return dice
}
