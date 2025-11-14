import { Action, BlockColor, blockFromXYZ, blockInLine, XYZ, XYZequal } from "@piggo-gg/core"

export type PlaceParams = {
  camera: XYZ
  dir: XYZ
  pos: XYZ
  type?: number
  blockColor?: BlockColor
}

export const Place = Action<PlaceParams>("place", ({ params, world }) => {
  const { pos, dir, camera } = params

  const beamResult = blockInLine({ from: camera, dir, world })
  if (!beamResult) return undefined

  const { outside, inside } = beamResult

  // return if player is on block
  if (XYZequal(outside, blockFromXYZ(pos))) return

  // place the block
  const placed = world.blocks.add({ type: params.type ?? inside.type, ...outside })
  if (placed) world.client?.sound.play({ name: "click2" })

  if (params.blockColor !== undefined) {
    world.blocks.coloring[`${outside.x},${outside.y},${outside.z}`] = params.blockColor
  }
})
