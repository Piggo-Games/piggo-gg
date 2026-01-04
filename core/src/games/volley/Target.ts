import {
  Entity, Networked, NPC, pixiGraphics, Position, Renderable, SystemBuilder, timeToLand, XY
} from "@piggo-gg/core"

export const Target = () => {

  let ball: Entity<Position> | undefined = undefined

  let last: XY = { x: 0, y: 0 }

  const target = Entity<Renderable | Position>({
    id: "target",
    components: {
      position: Position(),
      networked: Networked(),
      npc: NPC({
        behavior: (_, world) => {
          if (!ball) {
            ball = world.entity<Position>("ball")
            if (!ball) return
          }

          const { z, x, y, velocity: v, gravity, standing } = ball.components.position.data

          if (v.x === last.x && v.y === last.y) return
          last = { x: v.x, y: v.y }

          const t = timeToLand(gravity, z, v.z)

          target.components.position.setPosition({
            x: x + v.x * t / 1000 * 25,
            y: y + v.y * t / 1000 * 25
          })

          target.components.renderable.visible = (!standing && gravity > 0)
        }
      }),
      renderable: Renderable({
        zIndex: 3.8,
        visible: false,
        setup: async (renderable) => {
          renderable.setGlow({ innerStrength: 1 })
          renderable.c = pixiGraphics().ellipse(0, 0, 6, 3).stroke({ color: 0x00ffff, alpha: 0.9, width: 1.5 })
        }
      })
    }
  })
  return target
}

// export const TargetSystem = SystemBuilder({
//   id: "TargetSystem",
//   init: ((world) => {

//     let target: Entity<Renderable> | undefined = undefined

//     return {
//       id: "BallTargetSystem",
//       query: [],
//       priority: 5,
//       onTick: () => {
//         const ball = world.entity<Position | Renderable>("ball")

//         if (ball) {
//           if (!target || !world.entity("target")) {
//             target = Target(ball)
//             world.addEntity(target)
//           }
//         }
//       }
//     }
//   })
// })
