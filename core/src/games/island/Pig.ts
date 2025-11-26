import { Collider, Entity, NPC, Position, Three } from "@piggo-gg/core"
import { Group, Mesh, Object3DEventMap } from "three"

export const Pig = () => {

  let mesh: Group<Object3DEventMap> | undefined = undefined

  let died = false

  const pig = Entity<Position>({
    id: "pig",
    components: {
      position: Position({ x: 12, y: 12, z: 2, gravity: 0.003 }),
      collider: Collider({ shape: "ball", radius: 0.1 }),
      npc: NPC({
        behavior: (_, world) => {
          if (!mesh) return

          const pc = world.client?.character()
          if (!died && pc?.components.inventory?.activeItem(world)?.id.startsWith("dagger")) {
            died = true
            mesh.rotation.x = Math.PI / 2
          }
        }
      }),
      three: Three({
        onRender: ({ delta, world }) => {
          const pos = pig.components.position.interpolate(world, delta)

          if (mesh) {
            mesh.position.set(pos.x, pos.z, pos.y)
          }
        },
        init: async ({ o, three }) => {
          three.gLoader.load("pig.gltf", (gltf) => {
            mesh = gltf.scene

            mesh.animations = gltf.animations
            mesh.frustumCulled = false

            const scale = 0.02
            mesh.scale.set(scale, scale, scale)

            mesh.rotation.order = "YXZ"
            mesh.rotation.y = Math.PI / 3 * 2

            mesh.traverse((child) => {
              if (child instanceof Mesh) {
                child.castShadow = true
                child.receiveShadow = true
              }
            })

            o.push(mesh)
          })
        }
      })
    }
  })
  return pig
}
