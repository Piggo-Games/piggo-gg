import {
  abs, Actions, Collider, Effects, Input, Item, ItemBuilder, ItemEntity,
  loadTexture, max, min, Networked, NPC, PI, Position, randomChoice, Renderable, Shadow
} from "@piggo-gg/core"
import { Sprite, Texture } from "pixi.js"

export const Dice: ItemBuilder = ({ character }) => {

  let rolling = false
  let bounced = false

  let sides: Record<number, Sprite> = {}
  let side = 1
  let sideAcc = 0

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
      shadow: Shadow(2.8, 3),
      actions: Actions({
        roll: ({ params }) => {
          if (!dice.components.position.data.follows) {
            dice.components.position.data.follows = character.id
            rolling = false
            sideAcc = 0
            bounced = false
            return
          }

          rolling = true

          const { pointingDelta } = params

          const xRatio = pointingDelta.x / (abs(pointingDelta.y) + abs(pointingDelta.x))
          const yRatio = pointingDelta.y / (abs(pointingDelta.y) + abs(pointingDelta.x))

          const x = 180 * xRatio
          const y = 180 * yRatio

          dice.components.position.data.z = 0.01
          dice.components.position.setVelocity({ x, y, z: 1 })
          dice.components.position.data.follows = null
        }
      }),
      npc: NPC({
        behavior: () => {
          const { position } = dice.components

          if (dice.components.renderable?.initialized && sides[side]) {
            for (const child of dice.components.renderable!.c.children) {
              child.visible = false
            }
            dice.components.renderable!.c.children[side - 1].visible = true
          }

          const grounded = position.data.z <= 0

          if (rolling && grounded && !bounced) {
            bounced = true
            console.log("DICE BOUNCED")
            position.setVelocity({ z: 0.8 })
          }

          const factor = (position.data.z <= 0 && bounced) ? 0.95 : 0.99
          position.scaleVelocity(factor, 8)

          if (rolling) sideAcc += factor
          // sideAcc += factor
          if (sideAcc > 12) {
            sideAcc = 0
            side = randomChoice([1, 2, 3, 4, 5, 6].filter(s => s !== side))
          }
        }
      }),
      effects: Effects(),
      renderable: Renderable({
        scaleMode: "nearest",
        zIndex: 4,
        interpolate: true,
        rotates: true,
        onRender: () => {
          if (rolling) {
            const { position } = dice.components

            const factor = abs(position.data.velocity.x) + abs(position.data.velocity.y)

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

          for (let i = 1; i <= 6; i++) {
            sides[i] = new Sprite(textures[`${i}`])
            sides[i].anchor.set(0.5, 0.5)
            r.c.addChild(sides[i])
          }
        }
      })
    }
  })
  return dice
}
