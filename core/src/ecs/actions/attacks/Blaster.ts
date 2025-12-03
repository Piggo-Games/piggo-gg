import {
  Action, Actions, blockInLine, Character, cos, Effects, Entity, Hitbox,
  Input, IslandSettings, Item, ItemComponents, max, min, modelOffset, Networked, NPC, PI,
  Position, rayBoxIntersect, rotateAroundZ, sin, Three, XY, XYZ, XYZdistance
} from "@piggo-gg/core"
import { CylinderGeometry, Mesh, MeshPhongMaterial, Object3D, Vector3 } from "three"

type ShootParams = {
  pos: XYZ, aim: XY
}

export const BlasterItem = ({ character }: { character: Character }) => {

  let mesh: Object3D | undefined = undefined
  let tracer: Object3D | undefined = undefined
  let tracerState = { tick: 0, velocity: { x: 0, y: 0, z: 0 }, pos: { x: 0, y: 0, z: 0 } }
  let spinUntil: number | null = null

  let cd = -100

  const recoilRate = 0.03
  const spinDuration = 24
  const spinRotation = PI * 2

  const item = Entity<ItemComponents>({
    id: `blaster-${character.id}`,
    components: {
      position: Position(),
      effects: Effects(),
      networked: Networked(),
      item: Item({
        name: "blaster",
        onTick: () => {
          const { recoil } = character.components.position.data

          if (recoil > 0) {
            character.components.position.data.recoil = max(0, recoil - recoilRate)
          }
        }
      }),
      input: Input({
        press: {
          "mb1": ({ character, world, aim, client }) => {
            if (!character) return
            if (!document.pointerLockElement && !client.mobile) return

            if (spinUntil && world.tick < spinUntil + 4) return
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
          spinUntil = world.tick + spinDuration

          const eyePos = { x: pos.x, y: pos.y, z: pos.z + 0.5 }
          const eyes = new Vector3(eyePos.x, eyePos.z, eyePos.y)

          const { recoil } = character.components.position.data

          if (recoil) aim.y += recoil * 0.1

          // apply recoil
          character.components.position.data.recoil = min(0.7, recoil + 0.55)

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
            if (target.components.health?.dead()) continue
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
            hitboxHit.entity.components.health?.damage(2, world)
            hitboxHit.entity.components.three?.flash(0.5)

            if (character.id === world.client?.character()?.id) {
              world.client.controls.localHit = { tick: world.tick, headshot: false }
            }

            return
          }

          if (!hit) {
            if (dir.y >= 0) return

            const t = -(eyePos.z + 0.06) / dir.y
            if (t < 0 || t > 50) return

            const x = eyePos.x + dir.x * t
            const y = eyePos.y + dir.z * t

            world.three?.spawnParticles({ x, y, z: -0.06 }, world, "water")
            return
          }

          world.three?.spawnParticles(hit.edge, world)

          // change block color
          if (world.debug && hit.inside.type === 12) {
            const { blockColor } = world.settings<IslandSettings>()
            world.blocks.coloring[`${hit.inside.x},${hit.inside.y},${hit.inside.z}`] = blockColor
            world.blocks.invalidate()
          }

          if (hit.inside.z === 0 && hit.inside.type !== 12) return

          // world.blocks.remove(hit.inside)
        }),
      }),
      three: Three({
        init: async ({ o, three }) => {

          // tracer
          const tracerGeometry = new CylinderGeometry(0.004, 0.004, 0.1, 8)
          tracer = new Mesh(tracerGeometry, new MeshPhongMaterial({ color: 0xffff99, emissive: 0xffff99 }))
          three.scene.add(tracer)

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

          if (spinUntil && spinUntil > world.tick) {
            const spinRemaining = spinUntil - world.tick - ratio
            if (spinRemaining > 0) {
              mesh.rotation.x = -(spinRotation / spinDuration) * spinRemaining
            }
          }
        }
      })
    },
  })

  return item
}
