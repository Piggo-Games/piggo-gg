import { Collider, destroyIntoVoxels, Entity, NPC, Particle, Position, randomVector3, Three } from "@piggo-gg/core"
import { Group, Mesh, Object3DEventMap } from "three"

export const Pig = () => {

  let mesh: Group<Object3DEventMap> | undefined = undefined

  let pinatas: Mesh[] | undefined = undefined
  let particles: Particle[] = []

  const pig = Entity<Position>({
    id: "pig",
    components: {
      position: Position({ x: 12, y: 12, z: 2, gravity: 0.003 }),
      collider: Collider({ shape: "ball", radius: 0.1 }),
      npc: NPC({
        behavior: (_, world) => {
          const pc = world.client?.character()
          if (pc?.components.inventory?.activeItem(world)?.id.startsWith("dagger")) {
            if (pinatas?.length) {
              pinatas.forEach(p => {
                p.visible = false
                const voxels = destroyIntoVoxels(p, 0.005)
                for (const voxel of voxels) {
                  particles.push({
                    mesh: voxel, tick: world.tick, velocity: randomVector3(0.005), duration: 26, gravity: 0.0003,
                    pos: { x: voxel.position.x, y: voxel.position.z, z: voxel.position.y }
                  })
                  world.three?.scene.add(voxel)
                }
              })
            }
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

            mesh.rotation.y = Math.PI / 3 * 2

            mesh.traverse((child) => {
              if (child instanceof Mesh) {
                child.castShadow = true
                child.receiveShadow = true

                const destr = child.clone() as Mesh
                destr.scale.set(0.005, 0.005, 0.005)
                destr.position.set(5, 1, 5)

                if (!pinatas) pinatas = []
                pinatas.push(destr)
                o.push(destr)
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
