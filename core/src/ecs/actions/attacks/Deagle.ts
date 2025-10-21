import {
  Action, Actions, BlockInLine, blockInLine, Character, cos, Effects, Entity, Gun,
  hypot, Input, Item, ItemComponents, max, min, Networked, NPC, PI,
  Player, playerForCharacter, Position, randomInt, randomLR, randomVector3,
  rayCapsuleIntersect, sin, Target, Three, World, XY, XYZ, XYZdistance
} from "@piggo-gg/core"
import { Color, CylinderGeometry, Mesh, MeshPhongMaterial, Object3D, SphereGeometry, Vector3 } from "three"

type ShootParams = {
  pos: XYZ, aim: XY, targets: Target[], rng: number, error: XY
}

export const DeagleItem = ({ character }: { character: Character }) => {

  let mesh: Object3D | undefined = undefined
  let tracer: Object3D | undefined = undefined
  let tracerState = { tick: 0, velocity: { x: 0, y: 0, z: 0 }, pos: { x: 0, y: 0, z: 0 } }

  const particles: { mesh: Mesh, velocity: XYZ, pos: XYZ, duration: number, tick: number, gravity: number }[] = []
  const decalColor = new Color("#333333")

  let cd = -100

  const mvtError = 0.04
  const jmpError = 0.12

  const recoilRate = 0.04

  const spawnParticles = (pos: XYZ, world: World, blood = false) => {
    const proto = particles[0]
    if (!proto) return

    // decal particle
    if (!blood) {
      const decal = proto.mesh.clone()
      decal.material = new MeshPhongMaterial({ color: decalColor, emissive: decalColor })
      decal.position.set(pos.x, pos.z, pos.y)

      particles.push({ mesh: decal, tick: world.tick, velocity: { x: 0, y: 0, z: 0 }, pos: { ...pos }, duration: 240, gravity: 0 })
      world.three?.scene.add(decal)
    }

    // explosion particles
    for (let i = 0; i < 20; i++) {
      const mesh = proto.mesh.clone()
      mesh.position.set(pos.x, pos.z, pos.y)

      // vary the color
      const color = blood ? new Color(`rgb(200, 0, 0)`) : new Color(`rgb(255, ${randomInt(256)}, 0)`)
      mesh.material = new MeshPhongMaterial({ color, emissive: color })

      particles.push({
        mesh,
        tick: world.tick,
        velocity: randomVector3(blood ? 0.015 : 0.03),
        pos: { ...pos },
        duration: blood ? 16 : 6,
        gravity: blood ? 0.0023 : 0
      })

      world.three?.scene.add(mesh)
    }
  }

  const item = Entity<ItemComponents | Gun>({
    id: `deagle-${character.id}`,
    components: {
      position: Position(),
      effects: Effects(),
      networked: Networked(),
      item: Item({ name: "deagle", stackable: false }),
      gun: Gun({ name: "deagle", clipSize: 7, automatic: false, reloadTime: 60, damage: 35, fireRate: 5, bulletSize: 0.02, speed: 3 }),
      input: Input({
        press: {

          "r": ({ hold, client, world }) => {
            if (hold) return

            const { gun } = item.components

            if (gun.ammo >= 7) return
            if (gun.data.reloading) return

            client.sound.play({ name: "reload" })

            return { actionId: "reload", params: { value: world.tick + 40 } }
          },

          "mb1": ({ hold, character, world, aim, client, delta }) => {
            if (hold) return
            if (!character) return
            if (!document.pointerLockElement && !client.mobile) return
            if (world.client?.menu) return

            if (item.components.gun.data.reloading) return

            if (item.components.gun!.ammo <= 0) {
              world.client?.sound.play({ name: "clink" })
              return
            }

            if (cd + 5 > world.tick) return
            cd = world.tick

            const { position } = character.components
            const pos = position.xyz()

            const targets: Target[] = world.characters()
              .filter(c => c.id !== character.id)
              .filter(c => c.components.health && c.components.health.data.hp > 0)
              .map(target => ({
                ...target.components.position.interpolate(world, delta ?? 0),
                id: target.id
              }))

            targets.sort((a, b) => {
              const aDist = XYZdistance(pos, a)
              const bDist = XYZdistance(pos, b)
              return aDist - bDist
            })

            const velocity = hypot(position.data.velocity.x, position.data.velocity.y, position.data.velocity.z)
            const errorFactor = mvtError * velocity + (position.data.standing ? 0 : jmpError)
            const error = { x: randomLR(errorFactor), y: randomLR(errorFactor) }

            const params: ShootParams = {
              aim, targets, error, pos, rng: randomLR(0.1)
            }

            return { actionId: "shoot", params }
          },
        }
      }),
      npc: NPC({
        behavior: (_, world) => {
          const { recoil } = character.components.position.data

          // TODO move this to a system
          if (recoil > 0) {
            character.components.position.data.recoil = max(0, recoil - recoilRate)
          }

          const { gun } = item.components

          if (world.tick === gun.data.reloading) {
            gun.ammo = 7
            gun.data.reloading = undefined
          }

          if (gun.ammo <= 0 && world.client?.mobile && !gun.data.reloading && recoil <= 0) {
            world.actions.push(world.tick, item.id, { actionId: "reload", params: { value: world.tick + 40 } })
            world.client.sound.play({ name: "reload" })
          }

          // dummy auto reload
          if (character.id.includes("dummy")) {
            // if (world.tick % 20 === 0 && gun.data.ammo > 0 && !gun.data.reloading) {
            //   world.actions.push(world.tick + 1, item.id, {
            //     actionId: "deagle", params: {
            //       pos: character.components.position.xyz(),
            //       aim: character.components.position.data.aim,
            //       targets: []
            //     }
            //   })
            // }
            if (world.tick % 120 === 0) {
              world.actions.push(world.tick, item.id, { actionId: "reload", params: { value: world.tick + 40 } })
            }
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

          const { pos, aim, targets, error } = params

          const eyePos = { x: pos.x, y: pos.y, z: pos.z + 0.5 }
          const eyes = new Vector3(eyePos.x, eyePos.z, eyePos.y)

          const { recoil } = character.components.position.data

          if (recoil) {
            aim.y += recoil * 0.1
            aim.x += recoil * params.rng * 0.5
          }

          if (error) {
            aim.x += error.x
            aim.y += error.y
          }

          if (!offline) item.components.gun!.ammo -= 1

          // apply recoil
          character.components.position.data.recoil = min(1.4, recoil + 0.45)

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

          let hit: { player: Player | undefined, block: BlockInLine | undefined, headshot: boolean, distance: number | undefined } = {
            player: undefined,
            block: undefined,
            headshot: false,
            distance: undefined
          }

          // raycast against blocks
          const beamResult = blockInLine({ from: eyePos, dir, world, cap: 60, maxDist: 30 })
          if (beamResult) {
            hit.block = beamResult
            hit.distance = XYZdistance(eyePos, beamResult.edge)
          }

          // raycast against characters
          for (const target of targets) {

            const targetEntity = world.entity<Position>(target.id)
            if (!targetEntity) continue

            // head
            const headCapsule = {
              A: { x: target.x, y: target.y, z: target.z + 0.52 },
              B: { x: target.x, y: target.y, z: target.z + 0.55 },
              radius: 0.04
            }

            const dist = XYZdistance(eyePos, target)
            if (hit.distance && dist > hit.distance) continue

            const headHit = rayCapsuleIntersect(eyePos, { x: dir.x, y: dir.z, z: dir.y }, headCapsule)
            if (headHit) {
              hit.player = playerForCharacter(world, target.id)
              hit.distance = XYZdistance(eyePos, target)
              hit.headshot = true
              hit.block = undefined
              spawnParticles({ ...headCapsule.A, z: headCapsule.A.z + 0.03 * headHit.tc }, world, true)
              break
            }

            // body
            const bodyCapsule = {
              A: { x: target.x, y: target.y, z: target.z + 0.09 },
              B: { x: target.x, y: target.y, z: target.z + 0.43 },
              radius: 0.064
            }

            if (rayCapsuleIntersect(eyePos, { x: dir.x, y: dir.z, z: dir.y }, bodyCapsule)) {
              hit.player = playerForCharacter(world, target.id)
              hit.distance = XYZdistance(eyePos, target)
              hit.block = undefined
              break
            }
          }

          if (hit.player) {
            if (character.id === world.client?.character()?.id) {
              world.client.controls.localHit = { tick: world.tick, headshot: hit.headshot }
            }

            const hitCharacter = hit.player.components.controlling.getCharacter(world)
            if (hitCharacter?.components.health) {
              const damage = hit.headshot ? 100 : 35
              hitCharacter.components.health.damage(
                damage, world, playerForCharacter(world, character.id)?.id, hit.headshot ? "headshot" : "body"
              )
            }
          } else if (hit.block) {
            spawnParticles(hit.block.edge, world)

            if (hit.block.inside.type === 6) {
              world.blocks.remove(hit.block.inside)
            }

            // if (world.debug) {
            //   if (beamResult.inside.type === 12) {
            //     world.blocks.setType(beamResult.inside, 3)
            //     delete world.blocks.coloring[`${beamResult.inside.x},${beamResult.inside.y},${beamResult.inside.z}`]
            //   } else {
            //     world.blocks.remove(beamResult.inside)
            //   }
            // } else if (beamResult.inside.type !== 12) {
            //   world.blocks.setType(beamResult.inside, 12)
            // } else {
            //   world.blocks.setType(beamResult.inside, 12)
            //   const xyzstr: XYZstring = `${beamResult.inside.x},${beamResult.inside.y},${beamResult.inside.z}`
            //   if (world.blocks.coloring[xyzstr]) {
            //     const color = nextColor(world.blocks.coloring[xyzstr] as BlockColor)
            //     world.blocks.coloring[xyzstr] = color
            //   } else {
            //     world.blocks.coloring[xyzstr] = `slategray`
            //   }
            // }
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

            mesh.receiveShadow = true
            mesh.castShadow = true

            mesh.rotation.order = "YXZ"

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
          mesh.position.copy({
            x: pos.x + offset.x,
            y: pos.z + 0.45 + offset.y,
            z: pos.y + offset.z
          })

          const { recoil } = character.components.position.data
          const localRecoil = recoil ? recoil - recoilRate * ratio : 0

          mesh.rotation.y = aim.x
          mesh.rotation.x = aim.y + localRecoil * 0.5

          if (item.components.gun.data.reloading) {
            const delta = item.components.gun.data.reloading - world.tick - ratio
            mesh.rotation.x = -(PI * 6) / 40 * delta
          }
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
