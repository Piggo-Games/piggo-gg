import { Collider, Debug, Entity, load, MarsState, NPC, Position, Renderable, Shadow } from "@piggo-gg/core"
import { Sprite } from "pixi.js"

const speed = 20
const maxZ = 3500

export const Rocket = (): Entity => {
  const rocket = Entity<Position | Renderable>({
    id: "rocket",
    components: {
      debug: Debug(),
      position: Position({ x: 0, y: 0 }),
      collider: Collider({ shape: "ball", radius: 0.1, group: "1" }),
      shadow: Shadow(4.5, 139, 0),
      npc: NPC({
        behavior: (_, world) => {
          const { launching } = world.state<MarsState>()

          const { position } = rocket.components

          if (launching && position.data.velocity.z === 0) {
            position.setVelocity({ z: speed })
          }

          if (position.data.z >= maxZ) {
            position.setVelocity({ z: 0 })
            position.setPosition({ z: 0 })

            world.state<MarsState>().launching = false
          }
        }
      }),
      renderable: Renderable({
        zIndex: 5,
        scale: 0.3,
        interpolate: true,
        setup: async (r, renderer) => {
          const f9 = await load("flamin-9.png")

          r.c = new Sprite(f9)

          renderer.camera.focus = rocket
        }
      })
    }
  })

  return rocket
}
