import {
  Action, Actions, blockInLine, Character, Effects, Input,
  Item, ItemEntity, Networked, Position, Three, XYZ, XYZdistance
} from "@piggo-gg/core"
import { CylinderGeometry, Mesh, MeshBasicMaterial, Quaternion, Vector3 } from "three"

const HookMesh = (): Mesh => {
  const geometry = new CylinderGeometry(0.01, 0.01, 1, 8)
  geometry.translate(0, 0.5, 0)

  const material = new MeshBasicMaterial({ color: 0x964B00 })

  const mesh = new Mesh(geometry, material)
  mesh.castShadow = true

  return mesh
}

export const HookItem = ({ character }: { character: Character }) => {

  const mesh = HookMesh()

  const item = ItemEntity({
    id: `hook-${character.id}`,
    components: {
      position: Position(),
      effects: Effects(),
      networked: Networked(),
      item: Item({ name: "hook", stackable: false }),
      actions: Actions({
        hook: Hook(),
      }),
      input: Input({
        press: {
          "mb1": ({ hold, character, world, client }) => {
            if (hold) return
            if (!character) return
            if (!document.pointerLockElement && !client.mobile) return
            if (world.client?.menu) return

            const dir = world.three!.camera.dir(world)
            const camera = world.three!.camera.pos()
            const pos = character.components.position.xyz()

            return { actionId: "hook", params: { dir, camera, pos } }
          }
        }
      }),
      three: Three({
        init: async (entity) => {
          entity.components.three.o.push(mesh)
        },
        onRender: ({ world, delta }) => {
          // mesh needs to be between tether position and player
          const characterPos = character.components.position
          const xyz = characterPos.interpolate(world, delta)

          if (!characterPos.data.tether) {
            mesh.visible = false
            return
          }
          mesh.visible = true

          const dx = characterPos.data.tether.x - xyz.x
          const dy = characterPos.data.tether.y - xyz.y
          const dz = characterPos.data.tether.z - xyz.z - 0.3

          const dist = XYZdistance(xyz, characterPos.data.tether)
          mesh.scale.y = dist

          mesh.position.set(xyz.x, xyz.z + 0.3, xyz.y)

          const up = new Vector3(0, 1, 0)
          const dir = new Vector3(dx, dz, dy).normalize()
          const quat = new Quaternion().setFromUnitVectors(up, dir)
          mesh.quaternion.copy(quat)
        }
      })
    }
  })

  return item
}

type HookParams = {
  camera: XYZ
  dir: XYZ
  pos: XYZ
}

export const Hook = () => Action<HookParams>("hook", ({ world, params, character }) => {
  const { pos, dir, camera } = params

  const characterPos = character?.components.position.data
  if (!characterPos) return

  if (characterPos.tether) {
    characterPos.tether = undefined
    if (character) character.components.position.data.tether = undefined
    return
  }

  const beamResult = blockInLine({ from: camera, dir, world, cap: 40 })
  if (beamResult) {
    if (world.client?.sound) world.client.sound.play({ name: "click3" })

    const hookPos = {
      x: beamResult.inside.x * 0.3,
      y: beamResult.inside.y * 0.3,
      z: beamResult.inside.z * 0.3 + 0.15
    }

    characterPos.tether = {
      ...hookPos,
      dist: XYZdistance(pos, hookPos)
    }
  }
})
