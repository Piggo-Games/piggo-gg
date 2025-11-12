import {
  Action, Actions, BlockInLine, blockInLine, Character, cos, Effects, Entity,
  Input, Item, ItemComponents, max, min, Networked, nextColor, NPC, Position,
  randomInt, randomVector3, sin, Three, World, XY, XYZ, XYZdistance, XYZstring
} from "@piggo-gg/core"
import { Color, CylinderGeometry, Mesh, MeshPhongMaterial, Object3D, SphereGeometry, Vector3 } from "three"

type ShootParams = {
  pos: XYZ, aim: XY
}

export const BlasterItem = ({ character }: { character: Character }) => {

  let mesh: Object3D | undefined = undefined
  let tracer: Object3D | undefined = undefined
  let tracerState = { tick: 0, velocity: { x: 0, y: 0, z: 0 }, pos: { x: 0, y: 0, z: 0 } }

  const particles: { mesh: Mesh, velocity: XYZ, pos: XYZ, duration: number, tick: number, gravity: number }[] = []

  let cd = -100

  const recoilRate = 0.06

  const spawnParticles = (pos: XYZ, world: World) => {
    const proto = particles[0]
    if (!proto) return

    // explosion particles
    for (let i = 0; i < 20; i++) {
      const mesh = proto.mesh.clone()
      mesh.position.set(pos.x, pos.z, pos.y)

      // vary the color
      const color = new Color(`rgb(255, ${randomInt(256)}, 0)`)
      mesh.material = new MeshPhongMaterial({ color, emissive: color })

      particles.push({
        mesh,
        tick: world.tick,
        velocity: randomVector3(0.03),
        pos: { ...pos },
        duration: 6,
        gravity: 0
      })

      world.three?.scene.add(mesh)
    }
  }

  const item = Entity<ItemComponents>({
    id: `blaster-${character.id}`,
    components: {
      position: Position(),
      effects: Effects(),
      networked: Networked(),
      item: Item({ name: "blaster", stackable: false }),
      npc: NPC({
        behavior: (_, world) => {
          const { recoil } = character.components.position.data

          if (recoil > 0) {
            character.components.position.data.recoil = max(0, recoil - recoilRate)
          }

          // dummy auto reload
          if (character.id.includes("dummy") && world.tick % 120 === 0) {
            world.actions.push(world.tick, item.id, { actionId: "reload", params: { value: world.tick + 40 } })
          }

          // particles
          for (let i = 1; i < particles.length; i++) {
            const p = particles[i]

            p.pos = {
              x: p.pos.x + p.velocity.x,
              y: p.pos.y + p.velocity.y,
              z: p.pos.z + p.velocity.z
            }

            p.velocity.z -= p.gravity
          }
        }
      }),
      input: Input({
        press: {
          "mb1": ({ character, world, aim, client, delta }) => {
            if (!character) return
            if (!document.pointerLockElement && !client.mobile) return

            if (cd + 5 > world.tick) return
            cd = world.tick

            const pos = character.components.position.xyz()

            return { actionId: "shoot", params: { aim, pos } }
          },
        }
      }),
      actions: Actions({
        reload: Action<{ value: number }>("reload", ({ params }) => {
          const { gun } = item.components
          if (!gun) return

          gun.data.reloading = params.value
        }),
        shoot: Action<ShootParams>("shoot", ({ world, params, offline }) => {
          const pc = world.client?.character()
          if (pc && character.id !== pc.id) {

            const distance = XYZdistance(pc.components.position.xyz(), character.components.position.xyz())
            const volume = max(0, 1 - distance / 20)

            world.client?.sound.play({ name: "deagle", volume })
          } else {
            world.client?.sound.play({ name: "deagle" })
          }

          const { pos, aim } = params

          const eyePos = { x: pos.x, y: pos.y, z: pos.z + 0.5 }
          const eyes = new Vector3(eyePos.x, eyePos.z, eyePos.y)

          const { recoil } = character.components.position.data

          // apply recoil
          character.components.position.data.recoil = min(0.7, recoil + 0.45)

          const target = new Vector3(
            -sin(aim.x) * cos(aim.y), sin(aim.y), -cos(aim.x) * cos(aim.y)
          ).normalize().multiplyScalar(10).add(eyes)

          const dir = target.clone().sub(eyes).normalize()

          // update tracer
          if (world.client) {
            const { localAim } = world.client.controls
            const offset = modelOffset(character.id === world.client.character()?.id ? localAim : aim, true, recoil)

            // tracer
            if (tracer) {
              const tracerPos = { x: eyes.x + offset.x, y: eyes.y + offset.y, z: eyes.z + offset.z }
              tracer.position.copy(tracerPos)

              const tracerDir = target.clone().sub(tracerPos).normalize()

              tracer.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), tracerDir)

              tracerState.tick = world.tick
              tracerState.velocity = tracerDir.clone().multiplyScalar(1.5)
              tracerState.pos = tracerPos
            }
          }

          let hit: { block: BlockInLine | undefined, distance: number | undefined } = {
            block: undefined,
            distance: undefined
          }

          // raycast against blocks
          const beamResult = blockInLine({ from: eyePos, dir, world, cap: 60, maxDist: 30 })
          if (beamResult) {
            hit.block = beamResult
            hit.distance = XYZdistance(eyePos, beamResult.edge)
          }

          if (hit.block) {
            spawnParticles(hit.block.edge, world)

            if (hit.block.inside.type === 6) {
              world.blocks.remove(hit.block.inside)
            }

            if (!beamResult) return

            if (world.debug) {
              world.blocks.remove(beamResult.inside)
            } else if (beamResult.inside.type !== 12) {
              // world.blocks.setType(beamResult.inside, 12)
            } else {
              const xyzstr: XYZstring = `${beamResult.inside.x},${beamResult.inside.y},${beamResult.inside.z}`
              if (world.blocks.coloring[xyzstr]) {
                const color = nextColor(world.blocks.coloring[xyzstr])
                world.blocks.coloring[xyzstr] = color
              } else {
                world.blocks.coloring[xyzstr] = `slategray`
              }
            }
          }
        }),
      }),
      three: Three({
        init: async (_, __, three) => {

          // tracer
          const tracerGeometry = new CylinderGeometry(0.004, 0.004, 0.1, 8)
          tracer = new Mesh(tracerGeometry, new MeshPhongMaterial({ color: 0xffff99, emissive: 0xffff99 }))
          three.scene.add(tracer)

          // particles
          const particleMesh = new Mesh(new SphereGeometry(0.008, 6, 6))
          particleMesh.castShadow = true

          particles.push({ mesh: particleMesh, velocity: { x: 0, y: 0, z: 0 }, tick: 0, pos: { x: 0, y: 0, z: 0 }, duration: 0, gravity: 0 })

          // gun
          three.gLoader.load("deagle.glb", (gltf) => {
            mesh = gltf.scene
            mesh.scale.set(0.025, 0.025, 0.025)

            mesh.rotation.order = "YXZ"

            mesh.traverse((child) => {
              if (child instanceof Mesh) {
                child.castShadow = true
                // child.receiveShadow = true
              }
            })

            item.components.three?.o.push(mesh)
          })
        },
        onRender: ({ world, delta, client, three }) => {
          const ratio = delta / 25

          const pos = character.components.position.interpolate(world, delta)

          let { aim } = character.components.position.data
          if (character.id === world.client?.character()?.id) {
            aim = client.controls.localAim
          }

          const offset = modelOffset(aim)

          // tracer
          if (tracer) {
            if (world.tick - tracerState.tick < 2) {
              tracer.visible = true
              tracer.position.set(
                tracerState.pos.x + tracerState.velocity.x * (world.tick - tracerState.tick + ratio),
                tracerState.pos.y + tracerState.velocity.y * (world.tick - tracerState.tick + ratio),
                tracerState.pos.z + tracerState.velocity.z * (world.tick - tracerState.tick + ratio)
              )
            } else {
              tracer.visible = false
            }
          }

          // particles
          for (let i = 1; i < particles.length; i++) {
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

          if (!mesh) return

          if (three.camera.mode === "third" && character.id === world.client?.character()?.id) {
            mesh.visible = false
            return
          } else {
            mesh.visible = true
          }

          if (character.components.health?.dead()) {
            mesh.visible = false
            return
          }

          // gun
          mesh.position.set(
            pos.x + offset.x,
            pos.z + 0.45 + offset.y,
            pos.y + offset.z
          )

          const { recoil } = character.components.position.data
          const localRecoil = recoil ? recoil - recoilRate * ratio : 0

          mesh.rotation.y = aim.x
          mesh.rotation.x = aim.y + localRecoil * 0.5
        }
      })
    },
  })

  return item
}

const modelOffset = (localAim: XY, tip = false, recoil = 0): XYZ => {
  const dir = { x: sin(localAim.x), y: cos(localAim.x), z: sin(localAim.y) }
  const right = { x: cos(localAim.x), y: -sin(localAim.x) }

  const offset = {
    x: -dir.x * 0.05 + right.x * 0.05,
    y: recoil * 0.03,
    z: -dir.y * 0.05 + right.y * 0.05
  }

  if (tip) {
    offset.x -= dir.x * 0.1
    offset.y -= 0.035 - localAim.y * 0.1
    offset.z -= dir.y * 0.1
  }

  return offset
}
