import { Collider, Entity, Position, Three } from "@piggo-gg/core"
import { Group, Mesh, Object3DEventMap } from "three"

export const Pig = () => {

  let mesh: Group<Object3DEventMap> | undefined = undefined

  const pig = Entity<Position>({
    id: "pig",
    components: {
      position: Position({ x: 8, y: 5, z: 2, gravity: 0.003 }),
      collider: Collider({ shape: "ball", radius: 0.1 }),
      three: Three({
        onRender: ({ delta, world }) => {
          const pos = pig.components.position.interpolate(world, delta)

          if (mesh) {
            mesh.position.set(pos.x, pos.z, pos.y)
          }
        },
        init: async (o, _, __, three) => {
          three.gLoader.load("pig.gltf", (gltf) => {

            mesh = gltf.scene
            mesh.animations = gltf.animations
            mesh.frustumCulled = false
            const scale = 0.02
            mesh.scale.set(scale, scale, scale)

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
