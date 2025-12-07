import {
  Actions, Collider, Effects, Input, Item, ItemBuilder, ItemEntity,
  loadTexture, max, min, Networked, NPC, Position, Renderable
} from "@piggo-gg/core"
import { Sprite } from "pixi.js"

export const Dice: ItemBuilder = ({ character }) => {

  let rolling = false

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
      actions: Actions({
        roll: () => {
          if (rolling) {
            rolling = false
            return
          }
          rolling = true

          dice.components.position.setVelocity({
            x: 100, z: 1,
          })
          dice.components.position.data.follows = null
        }
      }),
      npc: NPC({
        behavior: () => {
          if (rolling) {
            const { position } = dice.components
            // position.rotate(0.2)

            // position.scaleVelocity(0.99, 4)
            if (position.data.z <= 0) {
              position.scaleVelocity(0.98, 4)
            }
          }
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


            // position.rotate(0.1)
            const factor = position.data.velocity.x + position.data.velocity.y
            position.rotate(min(0.1, factor * 0.001))
            console.log("rotating", factor)
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
