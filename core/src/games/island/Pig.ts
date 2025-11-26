import { Collider, Entity, NPC, Position, Three } from "@piggo-gg/core"
import { BoxGeometry, CapsuleGeometry, Group, Mesh, MeshPhongMaterial, Object3DEventMap } from "three"

export const Pig = () => {

  let mesh: Group<Object3DEventMap> | undefined = undefined
  let died = false
  let hitboxes: { body?: Mesh } = {}

  const pig = Entity<Position>({
    id: "pig",
    components: {
      position: Position({ x: 11, y: 12, z: 2, gravity: 0.003 }),
      collider: Collider({ shape: "ball", radius: 0.1 }),
      npc: NPC({
        behavior: (_, world) => {
          if (!mesh || died) return

          const pc = world.client?.character()
          if (!died && pc?.components.inventory?.activeItem(world)?.id.startsWith("dagger")) {
            died = true
            mesh.rotation.x = Math.PI / 2
            hitboxes.body!.visible = false
          }

          mesh.rotation.y += 0.01

          // move hitbox
          if (hitboxes.body) {
            const pos = pig.components.position.data
            hitboxes.body.position.set(pos.x, pos.z + 0.17, pos.y)
            // hitboxes.body.quaternion.copy(mesh.quaternion)
            hitboxes.body.rotation.y = mesh.rotation.y
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
          // const bodyGeo = new CapsuleGeometry(0.2, 0.01)
          const bodyGeo = new BoxGeometry(0.28, 0.18, 0.34)
          const bodyMat = new MeshPhongMaterial({ color: 0x0000ff, wireframe: true })
          hitboxes.body = new Mesh(bodyGeo, bodyMat)
          hitboxes.body.rotation.order = "YXZ"
          o.push(hitboxes.body)

          three.gLoader.load("pig.gltf", (gltf) => {
            mesh = gltf.scene

            mesh.animations = gltf.animations
            mesh.frustumCulled = false

            const scale = 0.02
            mesh.scale.set(scale, scale, scale)

            mesh.rotation.order = "YXZ"
            mesh.rotation.y = Math.PI / 3 * 2
            // mesh.rotation.x = -Math.PI / 2

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
