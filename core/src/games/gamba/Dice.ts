import {
  Actions, Collider, Effects, Input, Item, ItemBuilder, ItemEntity,
  loadTexture, max, min, Networked, NPC, PI, Position, Renderable,
  Shadow, sign
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
            return { actionId: "roll", params: { entityId: entity } }
          }
        }
      }),
      shadow: Shadow(3, 6),
      actions: Actions({
        roll: () => {
          if (rolling) {
            rolling = false
            return
          }
          rolling = true

          dice.components.position.data.z = 0.01
          dice.components.position.setVelocity({
            x: 120, z: 1,
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
