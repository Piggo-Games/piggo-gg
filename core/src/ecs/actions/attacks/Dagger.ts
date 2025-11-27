import {
  Action, Actions, Character, Effects, Entity, Input, Item,
  ItemComponents, max, modelOffset, Networked, NPC, PI, Position, Three
} from "@piggo-gg/core"
import { Mesh, Object3D } from "three"

export const DaggerItem = ({ character }: { character: Character }) => {

  let mesh: Object3D | undefined = undefined
  let cd = -100

  const recoilRate = 0.06

  const item = Entity<ItemComponents>({
    id: `dagger-${character.id}`,
    components: {
      position: Position(),
      effects: Effects(),
      networked: Networked(),
      item: Item({ name: "dagger", stackable: false }),
      npc: NPC({
        behavior: () => {
          const { recoil } = character.components.position.data

          if (recoil > 0) {
            character.components.position.data.recoil = max(0, recoil - recoilRate)
          }
        }
      }),
      input: Input({
        press: {
          "mb1": ({ character, world, client }) => {
            if (!character) return
            if (!document.pointerLockElement && !client.mobile) return

            if (cd + 14 > world.tick) return
            cd = world.tick

            return { actionId: "swing", params: {} }
          }
        }
      }),
      actions: Actions({
        swing: Action("swing", ({ world, params }) => {
          character.components.position.data.recoil = 1.5

          world.client?.sound.play({ name: "whiff" })
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

          const localRecoil = recoil ? recoil - recoilRate * ratio : 0

          // rotation
          mesh.rotation.y = aim.x + PI / 2 + localRecoil * 0.5
          mesh.rotation.z = aim.y - localRecoil * 0.5
        }
      })
    }
  })

  return item
}
