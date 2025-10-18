import {
  Action, Actions, Character, Collider, copyMaterials, DeagleItem, Health,
  Hook, HookItem, hypot, Input, Inventory, max, Networked, PI, Place, Player,
  Point, Position, Team, Three, upAndDir, XYZ, XZ, StrikeSettings, StrikeState,
  cloneSkeleton, Ready, ColorMapping, colorMaterials, cos, sin
} from "@piggo-gg/core"
import {
  AnimationAction, AnimationMixer, CapsuleGeometry, Mesh,
  MeshPhongMaterial, Object3D, SkeletonHelper, Vector3
} from "three"

const walk = 0.42
const run = 1.2
const hop = 0.16
const leap = 0.3

export const Sarge = (player: Player): Character => {

  let hitboxes: { body: undefined | Mesh, head: undefined | Mesh } = { body: undefined, head: undefined }

  let pig: Object3D = new Object3D()
  let helper: SkeletonHelper | undefined = undefined

  let pigMixer: AnimationMixer | undefined

  let idleAnimation: AnimationAction | undefined
  let runAnimation: AnimationAction | undefined
  let deathAnimation: AnimationAction | undefined

  let animation: "idle" | "run" | "dead" = "idle"

  const isDummy = player.id.includes("dummy")

  const sarge = Character({
    id: `sarge-${player.id}`,
    components: {
      position: Position({
        friction: true,
        gravity: 0.003,
        x: isDummy ? 7.2 + player.components.team.data.team * 0.6 : 8.12, y: isDummy ? 5.3 : 8, z: 2,
        aim: isDummy ? { x: -3.14, y: 0 } : { x: 0, y: 0 }
      }),
      networked: Networked(),
      inventory: Inventory([DeagleItem, HookItem]),
      collider: Collider({ shape: "ball", radius: 0.1 }),
      health: Health(),
      input: Input({
        joystick: ({ client }) => {
          const { localAim } = client.controls
          const { power, angle } = client.controls.left

          const x = cos(angle)
          const y = sin(angle)

          const dir = {
            x: x * cos(-localAim.x) - y * sin(-localAim.x),
            y: x * sin(-localAim.x) + y * cos(-localAim.x)
          }

          return { actionId: "moveAnalog", params: { dir, power, angle } }
        },
        release: {
          "escape": ({ world, client }) => {
            if (!client.mobile) world.client?.pointerLock()
          },
          "mb1": ({ world, target, client }) => {
            if (target !== "canvas") return

            if (client.mobile && client.menu) {
              client.menu = false
              return
            }

            if (client.mobile) return

            world.client?.pointerLock()
            return
          }
        },
        press: {
          "mb2": ({ hold, world, character }) => {
            if (hold) return
            if (!character) return
            if (world.debug) {

              const dir = world.three!.camera.dir(world)
              const camera = world.three!.camera.pos()
              const pos = character.components.position.xyz()

              return { actionId: "place", params: { dir, camera, pos, type: 3 } }
            } else if (!world.client?.net.synced) {
              const dummy = world.entity<Position>(`sarge-player-dummy`)
              if (dummy) {
                const dir = world.three!.camera.dir(world)
                const camera = world.three!.camera.pos()

                const { position } = dummy.components

                position.setPosition({
                  x: camera.x + dir.x,
                  y: camera.y + dir.z,
                  z: camera.z,
                })

                position.data.aim = { x: -Math.atan2(dir.z, dir.x) + PI / 2, y: 0 }
              }
            }
          },

          "z": ({ hold }) => {
            if (hold) return
            return { actionId: "ready" }
          },

          // "t": ({ hold }) => {
          //   if (hold) return
          //   sarge.components.position.data.flying = !sarge.components.position.data.flying
          // },

          // "e" : ({ hold, world, character }) => {
          //   if (hold) return

          //   const pos = character?.components.position.data
          //   const dir = world.three?.camera.dir(world)
          //   const camera = world.three?.camera.pos()

          //   if (!pos || !dir || !camera) return

          //   return { actionId: "hook", params: { pos, dir, camera } }
          // },

          "q": ({ world, hold }) => {
            if (hold) return
            const { camera } = world.three!
            camera.mode = camera.mode === "first" ? "third" : "first"
            return
          },

          "n": ({ world, hold }) => {
            if (hold) return

            const settings = world.settings<StrikeSettings>()
            settings.showNametags = !settings.showNametags

            return
          },

          // debug
          "g": ({ world, hold }) => {
            if (hold === 5) {
              world.debug = !world.debug
            }
          },

          // jump
          " ": ({ hold }) => ({ actionId: "jump", params: { hold } }),

          // no movement
          "w,s": () => null, "a,d": () => null,

          // move
          "w,a": ({ world }) => ({ actionId: "move", params: { key: "wa", ...upAndDir(world) } }),
          "w,d": ({ world }) => ({ actionId: "move", params: { key: "wd", ...upAndDir(world) } }),
          "a,s": ({ world }) => ({ actionId: "move", params: { key: "as", ...upAndDir(world) } }),
          "d,s": ({ world }) => ({ actionId: "move", params: { key: "ds", ...upAndDir(world) } }),
          "w": ({ world }) => ({ actionId: "move", params: { key: "w", ...upAndDir(world) } }),
          "a": ({ world }) => ({ actionId: "move", params: { key: "a", ...upAndDir(world) } }),
          "s": ({ world }) => ({ actionId: "move", params: { key: "s", ...upAndDir(world) } }),
          "d": ({ world }) => ({ actionId: "move", params: { key: "d", ...upAndDir(world) } })
        }
      }),
      actions: Actions({
        place: Place,
        point: Point,
        ready: Ready,
        hook: Hook(),
        jump: Action("jump", ({ world, params }) => {
          const { position } = sarge.components

          if (position.data.flying) return
          if (!position.data.standing && params.hold) return
          if (sarge.components.health?.dead()) return

          const state = world.state<StrikeState>()
          if (!position.data.standing && state.jumped.includes(sarge.id)) return

          state.jumped.push(sarge.id)
          position.setVelocity({ z: max(0.05, 0.025 + position.data.velocity.z) })

          world.client?.sound.play({ name: "bubble", threshold: { pos: position.data, distance: 5 } })
        }),
        moveAnalog: Action("moveAnalog", ({ entity, params }) => {
          if (!params.dir.x || !params.dir.y || !params.power) return

          const { position } = entity?.components ?? {}
          if (!position) return

          let factor = 0

          if (position.data.standing) {
            factor = params.sprint ? run : walk
          } else {
            factor = params.sprint ? leap : hop
          }

          position.impulse({
            x: params.dir.x * params.power * factor,
            y: params.dir.y * params.power * factor
          })
        }),
        move: Action<{ up: XYZ, dir: XZ, key: string, sprint: boolean }>("move", ({ entity, params }) => {
          if (!params.up || !params.dir) return

          if (sarge.components.health?.dead()) return

          const up = new Vector3(params.up.x, params.up.y, params.up.z)
          const dir = new Vector3(params.dir.x, 0, params.dir.z)

          const { position } = entity?.components ?? {}
          if (!position) return

          if (!["wa", "wd", "as", "ds", "a", "d", "w", "s", "up"].includes(params.key)) return

          const toward = new Vector3()

          let rotating = 0

          if (params.key === "a") {
            toward.crossVectors(up, dir).normalize()

            rotating = 0.1
          } else if (params.key === "d") {
            toward.crossVectors(dir, up).normalize()

            rotating = -0.1
          } else if (params.key === "w") {
            toward.copy(dir).normalize()
          } else if (params.key === "s") {
            toward.copy(dir).negate().normalize()
          } else if (params.key === "wa") {
            const forward = dir.clone().normalize()
            const left = new Vector3().crossVectors(up, dir).normalize()
            toward.copy(forward.add(left).normalize())

            rotating = 0.1
          } else if (params.key === "wd") {
            const forward = dir.clone().normalize()
            const right = new Vector3().crossVectors(dir, up).normalize()
            toward.copy(forward.add(right).normalize())

            rotating = -0.1
          } else if (params.key === "as") {
            const backward = dir.clone().negate().normalize()
            const left = new Vector3().crossVectors(up, dir).normalize()
            toward.copy(backward.add(left).normalize())

            rotating = 0.1
          } else if (params.key === "ds") {
            const backward = dir.clone().negate().normalize()
            const right = new Vector3().crossVectors(dir, up).normalize()
            toward.copy(backward.add(right).normalize())

            rotating = -0.1
          }

          if (rotating) position.data.rotating = rotating

          let factor = 0

          if (position.data.flying) {
            factor = params.sprint ? 0.16 : 0.14
          } else if (position.data.standing) {
            factor = params.sprint ? run : walk
          } else {
            factor = params.sprint ? leap : hop
          }

          if (position.data.standing) {
            // world.client?.sound.play({ name: "steps", threshold: { pos: position.data, distance: 5 } })
          }

          position.impulse({ x: toward.x * factor, y: toward.z * factor })
        })
      }),
      team: Team(1),
      three: Three({
        onRender: ({ entity, world, delta, client, three, since }) => {
          const ratio = since / 25

          const { position } = entity.components
          const interpolated = position.interpolate(world, delta)

          const orientation = player.id === client.playerId() ? client.controls.localAim : position.data.aim

          // position
          pig.position.set(interpolated.x, interpolated.z + 0, interpolated.y)
          // if (world.debug) {
          hitboxes.body?.position.set(interpolated.x, interpolated.z + 0.26, interpolated.y)
          hitboxes.head?.position.set(interpolated.x, interpolated.z + 0.535, interpolated.y)
          // }

          // rotation
          pig.rotation.y = orientation.x + PI

          // animation
          let speed = hypot(position.data.velocity.x, position.data.velocity.y)

          if (runAnimation && idleAnimation && deathAnimation && pigMixer) {

            const dead = sarge.components.health?.dead() ?? false

            if (dead && player.id === client.playerId() && three.camera.mode !== "third") {
              three.camera.mode = "third"
            }

            if (animation === "dead" && !dead && player.id === client.playerId() && three.camera.mode === "third") {
              three.camera.mode = "first"
            }

            if (dead) {
              if (animation === "run") {
                runAnimation.crossFadeTo(deathAnimation.reset().play(), 0.10, false)
              } else if (animation === "idle") {
                idleAnimation.crossFadeTo(deathAnimation.reset().play(), 0.10, false)
              }
              speed = 2
              animation = "dead"
              // if (player.id.includes("dummy"))console.log("dead")
            } else {
              // if (player.id.includes("dummy"))console.log("alive", sarge.components.health?.data.hp)
              if (speed === 0) {
                if (animation === "run") {
                  runAnimation.crossFadeTo(idleAnimation.reset().play(), 0.10, false)
                } else if (animation === "dead") {
                  deathAnimation.crossFadeTo(idleAnimation.reset().play(), 0.10, false)
                }
                animation = "idle"
              } else {
                if (animation === "idle") {
                  idleAnimation?.crossFadeTo(runAnimation.reset().play(), 0.10, false)
                } else if (animation === "dead") {
                  deathAnimation.crossFadeTo(runAnimation.reset().play(), 0.10, false)
                }
                animation = "run"
              }
            }
          }

          pigMixer?.update(ratio * 0.02 + speed * ratio * 0.005)

          // helper?.update?.()

          if ((three.camera.transition < 125) && player.id === client.playerId()) {

            const opacity = three.camera.mode === "first" ? 1 - (three.camera.transition / 100) : three.camera.transition / 100

            pig.traverse((child) => {
              if (child instanceof Mesh) {
                child.material.opacity = opacity
              }
            })
          }
        },
        init: async (entity, world, three) => {

          // body
          const bodyGeo = new CapsuleGeometry(0.064, 0.34)
          const bodyMat = new MeshPhongMaterial({ color: 0x0000ff, transparent: true, opacity: 0.5 })
          hitboxes.body = new Mesh(bodyGeo, bodyMat)

          // head
          const headGeo = new CapsuleGeometry(0.04, 0.03)
          const headMat = new MeshPhongMaterial({ color: 0xff0000, transparent: true, opacity: 0.5 })
          hitboxes.head = new Mesh(headGeo, headMat)

          // entity.components.three.o.push(hitboxes.body, hitboxes.head)

          // character model
          three.gLoader.load("swat.glb", (gltf) => {

            pig = cloneSkeleton(gltf.scene)
            pig.animations = gltf.animations
            pig.frustumCulled = false
            pig.scale.set(0.32, 0.32, 0.32)

            // helper = new SkeletonHelper(pig.children[0].children[1])

            copyMaterials(gltf.scene, pig)
            colorMaterials(pig, SargeColors, player.components.team.data.team)

            pigMixer = new AnimationMixer(pig)

            idleAnimation = pigMixer.clipAction(pig.animations[8])
            runAnimation = pigMixer.clipAction(pig.animations[22])
            deathAnimation = pigMixer.clipAction(pig.animations[0])
            deathAnimation.loop = 2200
            deathAnimation.clampWhenFinished = true

            idleAnimation?.play()

            pig.traverse((child) => {
              if (child instanceof Mesh) {
                child.material.transparent = true
                child.material.opacity = player.id === world.client!.playerId() ? 0 : 1

                child.castShadow = true
                child.receiveShadow = true
              }
            })

            entity.components.three.o.push(pig)
          })
        }
      })
    }
  })

  return sarge
}

const SargeColors: ColorMapping = {
  "cead86": { 1: "#be9393", 2: "#be9393" },
  "4f535a": { 1: "#4f535a", 2: "#7e4f19" },
  "312e2b": { 1: "#312e2b", 2: "#2b1608" },
  "161616": { 1: "#453089", 2: "#671029" }
}
