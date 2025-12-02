import {
  Action, Actions, blockInLine, Character, cos, Effects, Entity, Hitbox,
  Input, Item, ItemComponents, max, min, modelOffset, Networked, NPC,
  Particle, Position, randomColorBG, randomColorRY, randomVector3,
  rayBoxIntersect, rotateAroundZ, sin, Three, World, XY, XYZ, XYZdistance
} from "@piggo-gg/core"
import { CylinderGeometry, Mesh, MeshPhongMaterial, Object3D, SphereGeometry, Vector3 } from "three"

type ShootParams = {
  pos: XYZ, aim: XY
}

export const BlasterItem = ({ character }: { character: Character }) => {

  let mesh: Object3D | undefined = undefined
  let tracer: Object3D | undefined = undefined
  let tracerState = { tick: 0, velocity: { x: 0, y: 0, z: 0 }, pos: { x: 0, y: 0, z: 0 } }

  const particles: Particle[] = []

  let cd = -100

  const recoilRate = 0.06

  const spawnParticles = (pos: XYZ, world: World, water = false) => {
    const proto = particles[0]
    if (!proto) return

    // explosion particles
    for (let i = 0; i < 20; i++) {
      const mesh = proto.mesh.clone()
      mesh.position.set(pos.x, pos.z, pos.y)

      // vary the color
      const color = water ? randomColorBG() : randomColorRY()
      mesh.material = new MeshPhongMaterial({ color, emissive: color })

      particles.push({
        mesh,
        tick: world.tick,
        velocity: randomVector3(0.03),
        pos: { ...pos },
        duration: water ? 9 : 6,
        gravity: water ? 0.0024 : 0
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
          "mb1": ({ character, world, aim, client }) => {
            if (!character) return
            if (!document.pointerLockElement && !client.mobile) return

            if (cd + 6 > world.tick) return
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
        shoot: Action<ShootParams>("shoot", ({ world, params }) => {
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

          const worldDir = { x: dir.x, y: dir.z, z: dir.y }
          const maxRayDistance = 30

          const hitboxEntities = world.queryEntities<Position | Hitbox>(
            ["position", "hitbox"],
            (e) => e.id !== character.id && !e.removed
          )

          let hitboxHit: { entity: Entity<Position | Hitbox>, distance: number, point: XYZ } | undefined

          // raycast against hitboxes
          for (const target of hitboxEntities) {
            const tpos = target.components.position.data
            const sinR = sin(-tpos.rotation)
            const cosR = cos(-tpos.rotation)
            const sinNeg = -sinR

            for (const shape of target.components.hitbox.shapes) {
              const rotatedOffset = rotateAroundZ(shape.offset, sinR, cosR)

              const center = {
                x: tpos.x + rotatedOffset.x,
                y: tpos.y + rotatedOffset.y,
                z: tpos.z + rotatedOffset.z
              }

              const half = { x: shape.width / 2, y: shape.depth / 2, z: shape.height / 2 }
              const min = { x: -half.x, y: -half.y, z: -half.z }
              const max = { x: half.x, y: half.y, z: half.z }

              const localOrigin = rotateAroundZ({
                x: eyePos.x - center.x,
                y: eyePos.y - center.y,
                z: eyePos.z - center.z
              }, sinNeg, cosR)

              const localDir = rotateAroundZ(worldDir, sinNeg, cosR)

              const t = rayBoxIntersect(localOrigin, localDir, min, max)
              if (t === null || t > maxRayDistance) continue

              if (!hitboxHit || t < hitboxHit.distance) {
                hitboxHit = {
                  entity: target,
                  distance: t,
                  point: {
                    x: eyePos.x + worldDir.x * t,
                    y: eyePos.y + worldDir.y * t,
                    z: eyePos.z + worldDir.z * t
                  }
                }
              }
            }
          }

          // raycast against blocks
          const hit = blockInLine({ from: eyePos, dir, world, cap: 60, maxDist: 30 })
          const blockDistance = hit ? XYZdistance(eyePos, hit.edge) : Infinity

          if (hitboxHit && hitboxHit.distance <= blockDistance) {
            console.log("hit")
            spawnParticles(hitboxHit.point, world, true)
            return
          }

          if (!hit) {
            if (dir.y >= 0) return

            const t = -(eyePos.z + 0.06) / dir.y
            if (t < 0 || t > 50) return

            const x = eyePos.x + dir.x * t
            const y = eyePos.y + dir.z * t

            spawnParticles({ x, y, z: -0.06 }, world, true)
            return
          }

          spawnParticles(hit.edge, world)

          if (hit.inside.z === 0 && hit.inside.type !== 12) return

          world.blocks.remove(hit.inside)
        }),
      }),
      three: Three({
        init: async ({ o, three }) => {

          // tracer
          const tracerGeometry = new CylinderGeometry(0.004, 0.004, 0.1, 8)
          tracer = new Mesh(tracerGeometry, new MeshPhongMaterial({ color: 0xffff99, emissive: 0xffff99 }))
          three.scene.add(tracer)

          // particles
          const particleMesh = new Mesh(new SphereGeometry(0.008, 6, 6))
          particleMesh.castShadow = true

          particles.push({ mesh: particleMesh, velocity: { x: 0, y: 0, z: 0 }, tick: 0, pos: { x: 0, y: 0, z: 0 }, duration: 0, gravity: 0 })

          // gun
          three.gLoader.load("flintlock.gltf", (gltf) => {
            mesh = gltf.scene
            mesh.scale.set(0.005, 0.005, 0.005)

            mesh.rotation.order = "YXZ"

            mesh.traverse((child) => {
              if (child instanceof Mesh) {
                child.castShadow = true
                // child.receiveShadow = true
              }
            })

            o.push(mesh)
          })
        },
        onRender: ({ world, delta, client, three }) => {
          const ratio = delta / 25

          const pos = character.components.position.interpolate(world, delta)

          let { aim } = character.components.position.data
          if (character.id === world.client?.character()?.id) {
            aim = client.controls.localAim
          }

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

          if (character.components.health?.dead() || character.components.inventory?.activeItem(world)?.id !== item.id) {
            mesh.visible = false
            return
          }

          // gun
          const offset = modelOffset(aim)
          mesh.position.set(
            pos.x + offset.x,
            pos.z + 0.47 + offset.y,
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
