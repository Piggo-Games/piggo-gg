import { Collider, Entity, Health, Hitbox, HitboxShape, NPC, Position, Three } from "@piggo-gg/core"
import { BoxGeometry, Group, Mesh, MeshPhongMaterial, Object3DEventMap } from "three"

export const Pig = () => {

  let mesh: Group<Object3DEventMap> | undefined = undefined
  let hitboxes: { body?: Mesh } = {}

  const bodyHitbox: HitboxShape = {
    type: "box",
    width: 0.28, height: 0.18, depth: 0.34,
    offset: { x: 0, y: 0, z: 0.17 }
  }

  const pig = Entity<Position | Health>({
    id: "pig",
    components: {
      position: Position({ x: 11, y: 12, z: 2, gravity: 0.003, rotation: Math.PI }),
      collider: Collider({ shape: "ball", radius: 0.1 }),
      health: Health({ hp: 10 }),
      npc: NPC({
        behavior: (_, world) => {
          if (!mesh) return

          const { died } = pig.components.health.data
          if (died) {
            if (world.tick - died > 80) {
              pig.components.health.data.hp = 10
              pig.components.health.data.died = null
              mesh.rotation.x = 0
              return
            }
            mesh.rotation.x = Math.PI / 2
            hitboxes.body!.visible = false
            return
          }

          // pig.components.position.data.rotation += 0.01

          // move hitbox
          if (hitboxes.body) {
            const pos = pig.components.position.data
            hitboxes.body.position.set(pos.x, pos.z + bodyHitbox.offset.z, pos.y)
            hitboxes.body.rotation.y = mesh.rotation.y

            hitboxes.body.visible = world.debug
          }
        }
      }),
      hitbox: Hitbox([bodyHitbox]),
      three: Three({
        onRender: ({ delta, world }) => {
          const pos = pig.components.position.interpolate(world, delta)

          if (mesh) {
            mesh.position.set(pos.x, pos.z, pos.y)
            mesh.rotation.y = pig.components.position.data.rotation
          }
        },
        init: async ({ o, three }) => {
          const bodyGeo = new BoxGeometry(bodyHitbox.width, bodyHitbox.height, bodyHitbox.depth)
          const bodyMat = new MeshPhongMaterial({ color: 0x0000ff, wireframe: true })
          hitboxes.body = new Mesh(bodyGeo, bodyMat)

          o.push(hitboxes.body)

          three.gLoader.load("pig.gltf", (gltf) => {
            mesh = gltf.scene

            mesh.animations = gltf.animations
            mesh.frustumCulled = false

            mesh.scale.set(0.02, 0.02, 0.02)

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
  return pig
}
