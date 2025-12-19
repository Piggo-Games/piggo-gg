import {
  abs, Actions, Collider, D6, Data, Debug, Effects, Entity, IslandState, hypot,
  loadTexture, max, min, Networked, NPC, PI, Position, Renderable, round, Shadow, XY
} from "@piggo-gg/core"
import { Sprite } from "pixi.js"

type DiceRollParams = {
  shooterId: string
  pointingDelta: XY
}

type DiceComponents = Actions | Collider | Data | Debug | Effects | NPC | Networked | Position | Renderable | Shadow

export const Dice = (order: 1 | 2) => {

  const throwSpeed = 100
  const throwUp = 2

  let rolling = false
  let bounced = false
  let landed = false
  let decided = false
  let dropped = false

  let lastShooter: string | null = null

  let sides: Record<number, Sprite> = {}

  let side: D6 = 1
  let sideAcc = 0

  const reset = (shooterId: string | null) => {
    rolling = false
    sideAcc = 0
    bounced = false
    landed = false
    decided = false
    dropped = false

    dice.components.data.set("side", side)
    dice.components.data.set("sideAcc", sideAcc)

    dice.components.position.setVelocity({ x: 0, y: 0, z: 0 }).setRotation(0)
    dice.components.position.data.follows = shooterId
  }

  const id = `dice-${order}`

  const dice = Entity<DiceComponents>({
    id,
    components: {
      networked: Networked(),
      debug: Debug(),
      data: Data({ data: { side, sideAcc } }),
      collider: Collider({ shape: "ball", radius: 3, group: "none", restitution: 1 }),
      position: Position({
        gravity: 0.12,
        offset: { x: order === 1 ? -6 : 6, y: -6 }
      }),
      shadow: Shadow(3.5, 4),
      actions: Actions({
        roll: ({ params, world }) => {
          const { shooterId, pointingDelta } = params as DiceRollParams
          const state = world.state<IslandState>()

          if (state.shooter !== shooterId) return
          if (rolling) return

          const shooter = world.entity(shooterId)
          const shooterPos = shooter?.components.position
          if (!shooterPos) return

          if (!dice.components.position.data.follows) {
            reset(shooterId)
            world.actions.push(world.tick + 2, id, { actionId: "roll", params })
            return
          }

          rolling = true
          dropped = true
          decided = false
          bounced = false
          landed = false

          world.client?.sound.play({ name: "throw" })

          const xRatio = pointingDelta.x / (abs(pointingDelta.y) + abs(pointingDelta.x))
          const yRatio = pointingDelta.y / (abs(pointingDelta.y) + abs(pointingDelta.x))
          const strength = Math.min(abs(pointingDelta.x) + abs(pointingDelta.y) - 70, 200)

          const offset = (order === 1) ? -1 : 1

          const x = throwSpeed * xRatio + strength * xRatio + offset * yRatio * 30
          const y = throwSpeed * yRatio + strength * yRatio + offset * xRatio * 30

          const shooterZ = shooterPos.data.z

          dice.components.position.data.z = 0.01 + shooterZ
          dice.components.position.setVelocity({ x, y, z: max(0, throwUp - shooterZ) + offset * 0.2 })
          dice.components.position.data.follows = null
          dice.components.collider!.setGroup("2")
        }
      }),
      npc: NPC({
        behavior: (_, world) => {
          const state = world.state<IslandState>()

          const shooterId = state.shooter
          if (shooterId !== lastShooter && !rolling) {
            lastShooter = shooterId
            reset(shooterId)
          }

          const { position, collider } = dice.components

          // should fly over bad guys
          collider!.setGroup(!dropped ? "none" : (position.data.z > 20) ? "3" : "2")

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

          if (rolling) {
            sideAcc += factor
            state[`die${order}`] = null
          } else if (!decided && dropped) {
            state[`die${order}`] = side as D6
            decided = true
          }

          // TODO does this fix netcode ?
          // dice.components.data.set("side", side)
          // dice.components.data.set("sideAcc", sideAcc)

          if (sideAcc > 12) {
            sideAcc = 0
            side = world.random.choice([1, 2, 3, 4, 5, 6].filter(s => s !== side)) as D6
          }

          // rolling logic
          if (rolling) {
            const speed = abs(position.data.velocity.x) + abs(position.data.velocity.y)

            // if it rolls past 90deg, return to 0
            if (position.data.rotation >= PI / 2) {
              position.data.rotation = 0 + (position.data.rotation - PI / 2)
            }

            // if slow, stop flat
            if (speed >= 60) {
              position.rotate(min(0.3, speed * 0.003))
            } else {
              if (position.data.rotation <= 0.2) {
                position.data.rotation = 0
                rolling = false
                return
              }

              const amount = max(0.09, speed * 0.003)
              position.rotate(amount)
            }
          }

          if (!dropped && shooterId?.startsWith("ian")) {
            const shooter = world.entity(shooterId ?? "")
            if (!shooter) return

            const shooterPos = shooter.components.position
            if (!shooterPos) return

            const { pointingDelta } = shooterPos?.data
            const hypotenuse = hypot(pointingDelta.x, pointingDelta.y)

            const hyp_x = pointingDelta.x / hypotenuse
            const hyp_y = pointingDelta.y / hypotenuse

            position.data.offset = {
              x: round(hyp_x * min(10, abs(pointingDelta.x)), 2),
              y: round(hyp_y * min(10, abs(pointingDelta.y)) - 2, 2)
            }
          } else {
            position.data.offset = { x: -12, y: 0 }
          }
        }
      }),
      effects: Effects(),
      renderable: Renderable({
        scaleMode: "nearest",
        zIndex: 4,
        interpolate: true,
        rotates: true,
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
