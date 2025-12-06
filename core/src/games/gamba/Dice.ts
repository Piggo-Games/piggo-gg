import {
  Actions, Effects, Input, Item, ItemBuilder, ItemEntity,
  loadTexture, Networked, NPC, Position, Renderable
} from "@piggo-gg/core"
import { Sprite } from "pixi.js"

export const Dice: ItemBuilder = ({ character }) => {

  let spinning = false

  const dice = ItemEntity({
    id: `dice`,
    components: {
      networked: Networked(),
      position: Position({ follows: character.id }),
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
          if (spinning) {
            spinning = false
            return
          }

          spinning = true

          // dice.components.position.rotate(0.5)
        }
      }),
      npc: NPC({
        behavior: () => {
          // if (spinning) {
          //   const { position } = dice.components
          //   position.rotate(0.2)
          // }
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
          if (spinning) {
            const { position } = dice.components
            position.rotate(0.1)
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
