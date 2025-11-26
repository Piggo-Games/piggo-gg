import { Collider, destroyIntoVoxels, Entity, NPC, Particle, Position, randomVector3, Three } from "@piggo-gg/core"
import { Group, Mesh, Object3DEventMap } from "three"

export const Pig = () => {

  let mesh: Group<Object3DEventMap> | undefined = undefined

  let pinatas: Mesh[] | undefined = undefined
  let particles: Particle[] = []
  let exploded = false

  const pig = Entity<Position>({
    id: "pig",
    components: {
      position: Position({ x: 12, y: 12, z: 2, gravity: 0.003 }),
      collider: Collider({ shape: "ball", radius: 0.1 }),
      npc: NPC({
        behavior: (_, world) => {
          if (!mesh) return

          const pc = world.client?.character()
          if (!exploded && pc?.components.inventory?.activeItem(world)?.id.startsWith("dagger")) {
            exploded = true

            mesh.rotation.x = Math.PI / 2

            // mesh.visible = false

            // if (pinatas?.length) {
            //   for (const pinata of pinatas) {
            //     const voxels = destroyIntoVoxels(pinata, 0.04)
            //     console.log("destroyed pinata into", voxels.length, "voxels")
            //     for (const voxel of voxels) {
            //       voxel.frustumCulled = false
            //       particles.push({
            //         mesh: voxel, tick: world.tick, velocity: randomVector3(0), duration: 260, gravity: 0,
            //         pos: { x: voxel.position.x, y: voxel.position.z, z: voxel.position.y }
            //       })
            //       world.three?.scene.add(voxel)
            //     }
            //   }
            // }
          }
        }
      }),
      three: Three({
        onRender: ({ delta, world }) => {
          const pos = pig.components.position.interpolate(world, delta)

          if (mesh) {
            mesh.position.set(pos.x, pos.z, pos.y)
          }

          const ratio = delta / 25

          // particles
          for (let i = 0; i < particles.length; i++) {
            const p = particles[i]

            if (world.tick - p.tick >= p.duration) {
              if (p.mesh.parent) {
                world.three?.scene.remove(p.mesh)
              }
              particles.splice(i, 1)
              i--
            } else {
              p.mesh.position.set(
                p.pos.x + p.velocity.x * ratio,
                p.pos.z + p.velocity.z * ratio,
                p.pos.y + p.velocity.y * ratio
              )
            }
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

                if (!pinatas) pinatas = []
                pinatas.push(child)

                // const destr = child.clone() as Mesh
                // destr.scale.set(scale, scale, scale)
                // destr.position.set(5, 2, 5)
                // determineCrossOrigin.
                // destr.position
                // destr.visible = false
                // destr.scale.set(0.02, 0.02, 0.02)
                // destr.position.set(5, 1, 5)
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
