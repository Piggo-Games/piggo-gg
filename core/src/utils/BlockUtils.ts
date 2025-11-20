import { Block, floor, hypot, min, World, XYZ } from "@piggo-gg/core"

export const blockFromXYZ = (xyz: XYZ) => ({
  x: floor((0.15 + xyz.x) / 0.3),
  y: floor((0.15 + xyz.y) / 0.3),
  z: floor(xyz.z / 0.3)
})

type BlockInLineProps = {
  from: XYZ
  dir: XYZ
  world: World
  cap?: number
  maxDist?: number
}

export type BlockInLine = undefined | {
  inside: Block
  outside: XYZ
  edge: XYZ
}

export const blockInLine = ({ from, dir, world, maxDist = 10, cap = 10 }: BlockInLineProps): BlockInLine => {
  const current = { ...from }

  const outside = blockFromXYZ(current)

  let travelled = 0

  while (travelled < maxDist && cap > 0) {

    const xGap = (current.x + 0.15) % 0.3
    const yGap = (current.y + 0.15) % 0.3
    const zGap = current.z % 0.3

    const xStep = dir.x >= 0 ? (0.3 - xGap) / dir.x : (xGap / -dir.x)
    const yStep = dir.z >= 0 ? (0.3 - yGap) / dir.z : (yGap / -dir.z)
    const zStep = dir.y >= 0 ? (0.3 - zGap) / dir.y : (zGap / -dir.y)

    const minStep = min(xStep, yStep, zStep)

    const xDist = dir.x * minStep * 1.01
    const yDist = dir.z * minStep * 1.01
    const zDist = dir.y * minStep * 1.01

    current.x += xDist
    current.y += yDist
    current.z += zDist

    if (current.z <= 0) return undefined

    travelled += hypot(xDist, yDist, zDist)
    cap -= 1

    const insideBlock = {
      x: floor((0.15 + current.x) / 0.3),
      y: floor((0.15 + current.y) / 0.3),
      z: floor(current.z / 0.3)
    }

    const type = world.blocks.atIJK(insideBlock)
    if (type) return {
      outside, inside: { type, ...insideBlock }, edge: { ...current }
    }

    outside.x = insideBlock.x
    outside.y = insideBlock.y
    outside.z = insideBlock.z
  }

  return undefined
}

export const nextBlock = ({ from, dir, dist }: { from: XYZ, dir: XYZ, dist: number }): XYZ | undefined => {
  const current = { ...from }

  let travelled = 0

  while (travelled < dist) {
    const xGap = (current.x + 0.15) % 0.3
    const yGap = (current.y + 0.15) % 0.3
    const zGap = current.z % 0.3

    const xStep = dir.x >= 0 ? (0.3 - xGap) / dir.x : (xGap / -dir.x)
    const yStep = dir.z >= 0 ? (0.3 - yGap) / dir.z : (yGap / -dir.z)
    const zStep = dir.y >= 0 ? (0.3 - zGap) / dir.y : (zGap / -dir.y)

    const minStep = min(xStep, yStep, zStep)

    const xDist = dir.x * minStep * 1.01
    const yDist = dir.z * minStep * 1.01
    const zDist = dir.y * minStep * 1.01

    current.x += xDist
    current.y += yDist
    current.z += zDist

    if (current.z <= 0) return undefined

    travelled += hypot(xDist, yDist, zDist)
  }

  const insideBlock = {
    x: floor((0.15 + current.x) / 0.3),
    y: floor((0.15 + current.y) / 0.3),
    z: floor(current.z / 0.3)
  }

  return insideBlock
}
