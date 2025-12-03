import {
  Action, Actions, Character, Effects, Entity, Health, Hitbox, Input,
  Item, ItemComponents, PI, Position, Three, XY, cos, max, modelOffset,
  Networked, NPC, rotateAroundZ, sin, sphereBoxIntersect
} from "@piggo-gg/core"
import { Mesh, MeshBasicMaterial, Object3D, SphereGeometry } from "three"

type SwingParams = {
  aim: XY
}

export const DaggerItem = ({ character }: { character: Character }) => {

  let mesh: Object3D | undefined = undefined
  let cd = -100
  let debugSphere: Mesh | undefined = undefined
  let lastSwing: { tick: number, center: { x: number, y: number, z: number } } | undefined = undefined

  const swingRadius = 0.35
  const swingDistance = 0.75

  let dist = 0
  const recoilRate = 0.06

  const item = Entity<ItemComponents>({
    id: `dagger-${character.id}`,
    components: {
      position: Position(),
      effects: Effects(),
      networked: Networked(),
      item: Item({
        name: "dagger", onTick: () => {
          // const { recoil } = character.components.position.data

          if (dist > 0) {
            dist = max(0, dist - recoilRate)
            // character.components.position.data.recoil = max(0, recoil - recoilRate)
          }
        }
      }),
      input: Input({
        press: {
          "mb1": ({ character, world, client, aim }) => {
            if (!character) return
            if (!document.pointerLockElement && !client.mobile) return

            // if (cd + 14 > world.tick) return
            if (dist > 0) return
            cd = world.tick

            const swingAim = aim ?? character.components.position.data.aim

            return { actionId: "swing", params: { aim: swingAim } }
          }
        }
      }),
      actions: Actions({
        swing: Action<SwingParams>("swing", ({ world, params }) => {
          // character.components.position.data.recoil = 1.5
          dist = 1.5

          const aim = params.aim ?? character.components.position.data.aim

          const pos = character.components.position.xyz()
          const forward = {
            x: -sin(aim.x) * cos(aim.y),
            y: -cos(aim.x) * cos(aim.y),
            z: sin(aim.y)
          }

          const center = {
            x: pos.x + forward.x * swingDistance,
            y: pos.y + forward.y * swingDistance,
            z: pos.z + 0.45 + forward.z * swingDistance
          }

          lastSwing = { tick: world.tick, center }

          const hitboxEntities = world.queryEntities<Position | Hitbox | Health>(
            ["position", "hitbox"],
            (e) => e.id !== character.id && !e.removed
          )

          let hit = false

          for (const target of hitboxEntities) {
            const { position, health, hitbox } = target.components
            if (health?.dead()) continue

            const { rotation, x, y, z } = position.data
            const sinR = sin(-rotation)
            const cosR = cos(-rotation)

            for (const shape of hitbox.shapes) {
              const offset = rotateAroundZ(shape.offset, sinR, cosR)

              const boxCenter = {
                x: x + offset.x,
                y: y + offset.y,
                z: z + offset.z
              }

              const half = { x: shape.width / 2, y: shape.depth / 2, z: shape.height / 2 }

              if (sphereBoxIntersect(center, swingRadius, boxCenter, half, sinR, cosR)) {
                health?.damage(3, world, character.id, "dagger")
                target.components.three?.flash(0.5)
                hit = true
                break
              }
            }
          }

          if (hit) {
            world.client?.sound.play({ name: "slash" })
            if (character.id === world.client?.character()?.id) {
              world.client.controls.localHit = { tick: world.tick, headshot: false }
            }
          } else {
            world.client?.sound.play({ name: "whiff" })
          }
        })
      }),
      three: Three({
        init: async ({ o, three }) => {

          three.gLoader.load("dagger.gltf", (gltf) => {
            mesh = gltf.scene
            mesh.scale.set(0.004, 0.004, 0.004)

            mesh.rotation.order = "YXZ"

            mesh.traverse((child) => {
              if (child instanceof Mesh) {
                child.castShadow = true
              }
            })

            o.push(mesh)
          })

          const geo = new SphereGeometry(swingRadius, 12, 12)
          const mat = new MeshBasicMaterial({ color: 0xff0000, wireframe: true })
          debugSphere = new Mesh(geo, mat)
          debugSphere.visible = false
          o.push(debugSphere)
        },
        onRender: ({ world, delta, client, three }) => {
          const ratio = delta / 25

          const pos = character.components.position.interpolate(world, delta)

          if (!mesh) return

          if (three.camera.mode === "third" && character.id === world.client?.character()?.id) {
            mesh.visible = false
            return
          } else {
            mesh.visible = true
          }

          if (debugSphere && lastSwing) {
            const show = world.tick - lastSwing.tick < 8
            debugSphere.visible = show && world.debug
            if (show) {
              debugSphere.position.set(lastSwing.center.x, lastSwing.center.z, lastSwing.center.y)
            }
          }

          if (character.components.health?.dead() || character.components.inventory?.activeItem(world)?.id !== item.id) {
            mesh.visible = false
            return
          }

          let { aim, recoil } = character.components.position.data
          if (character.id === world.client?.character()?.id) {
            aim = client.controls.localAim
          }

          // position
          const offset = modelOffset(aim)
          mesh.position.set(
            pos.x + offset.x,
            pos.z + 0.45 + offset.y,
            pos.y + offset.z
          )

          // const localRecoil = recoil ? recoil - recoilRate * ratio : 0
          const localDist = dist ? dist - recoilRate * ratio : 0

          // rotation
          mesh.rotation.y = aim.x + PI / 2 + localDist * 0.5
          mesh.rotation.z = aim.y - localDist * 0.5
        }
      })
    }
  })

  return item
}
