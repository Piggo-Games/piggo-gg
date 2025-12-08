import {
  abs, Actions, Collider, Effects, Input, Item, ItemBuilder, ItemEntity,
  loadTexture, max, min, Networked, NPC, PI, Position, randomChoice, Renderable, Shadow
} from "@piggo-gg/core"
import { Sprite } from "pixi.js"

export const Dice: ItemBuilder = ({ character }) => {

  const throwSpeed = 140
  const throwUp = 2

  let rolling = false
  let bounced = false
  let landed = false

  let sides: Record<number, Sprite> = {}
  let side = 1
  let sideAcc = 0

  const reset = () => {
    rolling = false
    sideAcc = 0
    bounced = false
    landed = false
    side = 1
  }

  const dice = ItemEntity({
    id: `dice`,
    components: {
      networked: Networked(),
      collider: Collider({ shape: "ball", radius: 4, group: "2", restitution: 1 }),
      position: Position({ follows: character.id, gravity: 0.12 }),
      item: Item({ name: "Dice" }),
      input: Input({
        press: {
          mb1: ({ hold, entity }) => {
            if (rolling || hold) return

            const { pointingDelta } = character.components.position.data
            return { actionId: "roll", params: { entityId: entity, pointingDelta } }
          }
        }
      }),
      shadow: Shadow(3, 4),
      actions: Actions({
        roll: ({ params }) => {
          if (!dice.components.position.data.follows) {
            dice.components.position.data.follows = character.id
            reset()
            return
          }

          rolling = true

          const { pointingDelta } = params

          const xRatio = pointingDelta.x / (abs(pointingDelta.y) + abs(pointingDelta.x))
          const yRatio = pointingDelta.y / (abs(pointingDelta.y) + abs(pointingDelta.x))
          const strength = Math.min(abs(pointingDelta.x) + abs(pointingDelta.y) - 50, 200)
          console.log(strength)

          const x = throwSpeed * xRatio + strength * xRatio
          const y = throwSpeed * yRatio + strength * yRatio

          dice.components.position.data.z = 0.01 + character.components.position.data.z
          dice.components.position.setVelocity({ x, y, z: throwUp })
          dice.components.position.data.follows = null
        }
      }),
      npc: NPC({
        behavior: (_, world) => {
          const { position } = dice.components

          if (dice.components.renderable?.initialized && sides[side]) {
            for (const child of dice.components.renderable!.c.children) {
              child.visible = false
            }
            dice.components.renderable!.c.children[side - 1].visible = true
          }

          const grounded = position.data.z <= 0

          if (grounded && bounced && !landed) {
            landed = true
            world.client?.sound.play({ name: "dice2" })
          }

          if (rolling && grounded && !bounced) {
            bounced = true
            world.client?.sound.play({ name: "dice1" })
            position.setVelocity({ z: throwUp * 0.7 })
          }

          const factor = (grounded && bounced) ? 0.92 : 0.994
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

            // if it rolls past 90deg, return to 0
            if (position.data.rotation >= PI / 2) {
              position.data.rotation = 0 + (position.data.rotation - PI / 2)
            }

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
