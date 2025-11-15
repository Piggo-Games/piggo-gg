import { ClientSystemBuilder, cos, max, min, sin, World, XYZ, XYZsub } from "@piggo-gg/core"
import { PerspectiveCamera, Vector3 } from "three"

export type ThreeCamera = {
  c: PerspectiveCamera
  mode: "first" | "third"
  transition: number
  dir: (world: World, factor?: number) => XYZ
  pos: () => XYZ
}

export const ThreeCamera = (): ThreeCamera => {

  const camera = new PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.01, 1000)
  camera.rotation.order = "YXZ"

  const ThreeCamera: ThreeCamera = {
    c: camera,
    mode: "first",
    transition: 125,
    dir: (world: World, factor: number) => {
      if (!world.client) return new Vector3(0, 0, 0)

      const { localAim } = world.client.controls

      return XYZ(new Vector3(
        -sin(localAim.x) * cos(localAim.y),
        -cos(localAim.x) * cos(localAim.y),
        sin(localAim.y),
      ).normalize().multiplyScalar(factor || 1))
    },
    pos: () => {
      return XYZ(ThreeCamera.c.position)
    }
  }
  return ThreeCamera
}

export const ThreeCameraSystem = () => ClientSystemBuilder({
  id: "ThreeCameraSystem",
  init: (world) => {

    let lastMode = world.three?.camera.mode || "first"

    return {
      id: "ThreeCameraSystem",
      query: [],
      priority: 9,
      onRender: (_, delta) => {
        if (!world.three || !world.client) return

        const pc = world.client.character()
        if (!pc) return

        const interpolated = pc.components.position.interpolate(world, delta)

        const { x, y } = world.client.controls.localAim
        const { camera } = world.three

        if (camera.mode !== lastMode) camera.transition = 0
        lastMode = camera.mode

        if (camera.transition < 125) {
          camera.transition += delta / 25 * 8
        }

        const firstPos = { x: interpolated.x, y: interpolated.y, z: interpolated.z + 0.5 }

        // const right = new Vector3().crossVectors(offset, new Vector3(0, 1, 0)).normalize()

        const offset = new Vector3(-sin(x) * cos(y), sin(y), -cos(x) * cos(y)).multiplyScalar(1)
        const thirdPos = { x: interpolated.x - offset.x, y: interpolated.y - offset.z, z: interpolated.z + 0.4 - offset.y }

        const diff = XYZsub(firstPos, thirdPos)

        const percent = max(0, min(1, camera.transition / 100))

        const { recoil } = pc.components.position.data

        if (camera.mode === "first") {
          if (camera.transition < 100) {
            camera.c.position.set(
              firstPos.x - diff.x * (1 - percent),
              firstPos.z - diff.z * (1 - percent),
              firstPos.y - diff.y * (1 - percent)
            )
          } else {
            camera.c.position.set(firstPos.x, firstPos.z, firstPos.y)
          }

          if (world.game.id === "build") {
            camera.c.rotation.set(y, x, 0)
          } else {
            camera.c.rotation.set(y + recoil * 0.03, x, 0)
          }
        } else {
          if (camera.transition < 100) {
            camera.c.position.set(
              thirdPos.x + diff.x * (1 - percent),
              thirdPos.z + diff.z * (1 - percent),
              thirdPos.y + diff.y * (1 - percent)
            )
          } else {
            camera.c.position.set(thirdPos.x, thirdPos.z, thirdPos.y)
            // camera.c.position.set(thirdPos.x + right.x * 0.8, thirdPos.z, thirdPos.y + right.z * 0.8)
          }

          camera.c.lookAt(
            interpolated.x + offset.x * 0.2,
            interpolated.z + 0.5 + percent * -0.1,
            interpolated.y + offset.z * 0.2
          )
        }
      }
    }
  }
})
