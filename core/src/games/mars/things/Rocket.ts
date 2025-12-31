import { Collider, Debug, Entity, load, MarsState, NPC, Position, Renderable, Shadow } from "@piggo-gg/core"
import { Sprite } from "pixi.js"
import { Emitter } from "@sosuisen/particle-emitter"

const speed = 20
const maxZ = 3500

export const Rocket = (): Entity => {

  let emitter: Emitter | undefined

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
        onRender: () => {
          if (!emitter) return
          console.log("emitting")
          emitter.update(0.01)
          emitter.emit = true
        },
        setup: async (r, renderer) => {
          const f9 = await load("flamin-9.png")
          
          // r.c = new Sprite(f9)

          renderer.camera.focus = rocket

          emitter = new Emitter(r.c, {
            emit: true,
            lifetime: {
              min: 0,
              max: 1000000
            },
            frequency: 0.001,
            emitterLifetime: 0,
            maxParticles: 1000,
            addAtBack: false,
            pos: {
              x: 0,
              y: 0
            },
            behaviors: [
              {
                type: "alpha",
                config: {
                  alpha: {
                    list: [
                      {
                        time: 0,
                        value: 0.62
                      },
                      {
                        time: 1,
                        value: 0
                      }
                    ]
                  }
                }
              },
              {
                type: "moveSpeedStatic",
                config: {
                  min: 500,
                  max: 500
                }
              },
              {
                type: "scale",
                config: {
                  scale: {
                    list: [
                      {
                        time: 0,
                        value: 0.25
                      },
                      {
                        time: 1,
                        value: 0.75
                      }
                    ]
                  },
                  minMult: 1
                }
              },
              {
                type: "color",
                config: {
                  color: {
                    list: [
                      {
                        time: 0,
                        value: "fff191"
                      },
                      {
                        time: 1,
                        value: "ff622c"
                      }
                    ]
                  }
                }
              },
              {
                type: "rotation",
                config: {
                  accel: 0,
                  minSpeed: 50,
                  maxSpeed: 50,
                  minStart: 265,
                  maxStart: 275
                }
              },
              {
                type: "textureRandom",
                config: {
                  textures: [
                    "particle.png",
                    "fire.png"
                  ]
                }
              },
              {
                type: "spawnShape",
                config: {
                  type: "torus",
                  data: {
                    x: 0,
                    y: 0,
                    radius: 10,
                    innerRadius: 0,
                    affectRotation: false
                  }
                }
              }
            ]
          })
        }
      })
    }
  })

  return rocket
}
