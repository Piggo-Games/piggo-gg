import { Entity, NPC, Position, Three } from "@piggo-gg/core"
import { BoxGeometry, Group, Mesh, MeshPhongMaterial, Object3DEventMap } from "three"

export const Shork = () => {

  let mesh: Group<Object3DEventMap> | undefined = undefined
  let died = false
  let hitboxes: { body?: Mesh } = {}

  const shork = Entity<Position>({
    id: "shork",
    components: {
      position: Position({ x: 15, y: 15, z: -0.25 }),
      // collider: Collider({ shape: "ball", radius: 0.1 }),
      npc: NPC({
        behavior: (_, world) => {
          if (!mesh || died) return

          const pc = world.client?.character()
          if (!died && pc?.components.inventory?.activeItem(world)?.id.startsWith("dagger")) {
            died = true
            mesh.rotation.x = Math.PI / 2
            hitboxes.body!.visible = false
          }

          mesh.rotation.y += world.debug ? 0.01 : 0

          // move hitbox
          if (hitboxes.body) {
            const pos = shork.components.position.data
            hitboxes.body.position.set(pos.x, pos.z + 0.17, pos.y)
            hitboxes.body.rotation.y = mesh.rotation.y

            hitboxes.body.visible = world.debug
          }
        }
      }),
      three: Three({
        onRender: ({ delta, world }) => {
          const pos = shork.components.position.interpolate(world, delta)

          if (mesh) {
            mesh.position.set(pos.x, pos.z, pos.y)
          }
        },
        init: async ({ o, three }) => {
          const bodyGeo = new BoxGeometry(0.28, 0.18, 0.34)
          const bodyMat = new MeshPhongMaterial({ color: 0x0000ff, wireframe: true })
          hitboxes.body = new Mesh(bodyGeo, bodyMat)

          o.push(hitboxes.body)

          three.gLoader.load("shork.gltf", (gltf) => {
            mesh = gltf.scene

            mesh.animations = gltf.animations
            mesh.frustumCulled = false

            mesh.scale.set(0.02, 0.02, 0.02)

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
  return shork
}
