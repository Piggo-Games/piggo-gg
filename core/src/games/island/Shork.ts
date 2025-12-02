import { Collider, cos, Entity, NPC, PI, Position, sin, Three } from "@piggo-gg/core"
import { Group, Mesh, Object3DEventMap } from "three"

export const Shork = () => {

  let mesh: Group<Object3DEventMap> | undefined = undefined

  const speed = 0.5

  const shork = Entity<Position>({
    id: "shork",
    components: {
      position: Position({ x: 15, y: 15, z: -0.67 }),
      collider: Collider({ shape: "ball", radius: 0.1 }),
      npc: NPC({
        behavior: (_, world) => {
          if (!mesh) return

          const { position } = shork.components
          const pc = world.client?.character()

          // if swimming, move toward player
          if (pc?.components.position.data.swimming) {
            const shorkPos = shork.components.position.data
            const pcPos = pc.components.position.data

            const dirX = pcPos.x - shorkPos.x
            const dirY = pcPos.y - shorkPos.y
            const length = Math.sqrt(dirX * dirX + dirY * dirY)

            if (length < 0.3) {
              position.setVelocity({ x: 0, y: 0 })
              return
            }

            position.setVelocity({ x: dirX / length * 1, y: dirY / length * 1 })

            // orient toward player
            position.data.rotation = Math.atan2(dirX, dirY)
          } else {

            position.rotate(0.002)
            const r = position.data.rotation + PI / 2

            position.setVelocity({
              x: cos(-r) * speed, y: sin(-r) * speed
            })
          }
        }
      }),
      three: Three({
        onRender: ({ delta, world }) => {
          const pos = shork.components.position.interpolate(world, delta)

          if (mesh) {
            mesh.position.set(pos.x, pos.z, pos.y)
            mesh.rotation.y = shork.components.position.data.rotation
          }
        },
        init: async ({ o, three }) => {
          three.gLoader.load("shork.gltf", (gltf) => {
            mesh = gltf.scene

            mesh.animations = gltf.animations
            mesh.frustumCulled = false

            mesh.scale.set(0.06, 0.06, 0.06)

            mesh.rotation.order = "YXZ"

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
  return shork
}
