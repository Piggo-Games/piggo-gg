import {
  Block, BlockPlan, BlockTree, floor, keys, logPerf, World, XY, XYZ, XYZstring
} from "@piggo-gg/core"

export type BlockColor = "rebeccapurple" | "slategray" |
  "chocolate" | "saddlebrown" | "cadetblue" | "cornflowerblue" |
  "rosybrown" | "sandybrown" | "tan" | "palevioletred" | "mediumseagreen"

export const nextColor = (current: BlockColor): BlockColor => {
  switch (current) {
    case "tan": return "slategray"
    case "slategray": return "mediumseagreen"
    case "mediumseagreen": return "chocolate"
    case "chocolate": return "saddlebrown"
    case "saddlebrown": return "cadetblue"
    case "cadetblue": return "rebeccapurple"
    case "rebeccapurple": return "cornflowerblue"
    case "cornflowerblue": return "rosybrown"
    case "rosybrown": return "palevioletred"
    case "palevioletred": return "sandybrown"
    case "sandybrown": return "tan"
  }
}

export type BlockData = {
  coloring: Record<XYZstring, string>
  add: (block: Block) => boolean
  addPlan: (plan: BlockPlan) => boolean
  clear: () => void
  dump: () => void
  setChunk: (chunk: XY, data: string) => void
  setType: (ijk: XYZ, type: number) => void
  atIJK: (ijk: XYZ) => number | undefined
  highestBlockIJ: (pos: XY, max?: number) => XYZ | undefined
  neighbors: (chunk: XY, dist?: number) => XY[]
  invalidate: () => void
  loadMap: (map: Record<string, string>) => void
  remove: (xyz: XYZ) => void
  needsUpdate: () => boolean
  visible: (at: XY[]) => Block[]
}

export const BlockData = (): BlockData => {

  const data: Int8Array[][] = []

  const chunks = 48 // TODO dynamic?
  for (let i = 0; i < chunks; i++) {
    data[i] = []
    for (let j = 0; j < chunks; j++) {
      data[i][j] = new Int8Array(4 * 4 * 32)
    }
  }

  let visibleCache: Record<string, Block[]> = {}
  let visibleDirty: Record<string, boolean> = {}

  const chunkey = (x: number, y: number) => `${x}:${y}`
  const chunkval = (x: number, y: number) => data[x]?.[y]

  const val = (x: number, y: number, z: number) => {
    const chunkX = floor(x / 4)
    const chunkY = floor(y / 4)

    const chunk = chunkval(chunkX, chunkY)
    if (!chunk) return chunk

    const xIndex = x - chunkX * 4
    const yIndex = y - chunkY * 4
    const index = z * 16 + yIndex * 4 + xIndex

    return chunk[index]
  }

  const blocks: BlockData = {
    coloring: {
      // "34,49,3": "mediumseagreen"
    },
    highestBlockIJ: (pos: XY, max?: number): XYZ | undefined => {
      let level = 0

      const xChunk = floor(pos.x / 4)
      const yChunk = floor(pos.y / 4)

      const chunk = data[xChunk]?.[yChunk]

      if (max && max > 32) max = 32

      if (chunk !== undefined) {

        const offset = (pos.x - xChunk * 4) + (pos.y - yChunk * 4) * 4

        const zStart = 0
        for (let z = zStart; z < (max ?? 32); z++) {
          const index = z * 16 + offset
          const type = chunk[index]
          if (type !== 0) level = z
        }
        return { x: pos.x, y: pos.y, z: level }
      }
      return undefined
    },
    clear: () => {
      for (let i = 0; i < chunks; i++) {
        for (let j = 0; j < chunks; j++) {
          data[i][j].fill(0) // todo craft -> strike doesn't clear all blocks properly
        }
      }
      visibleCache = {}
      visibleDirty = {}
    },
    dump: () => {
      const dump: Record<string, string> = {}

      // const dump: string[] = []
      for (let i = 0; i < chunks; i++) {
        for (let j = 0; j < chunks; j++) {
          const chunk = data[i][j]
          if (chunk) {
            const filled = chunk.some(v => v !== 0)
            if (filled) {
              const b64 = btoa(String.fromCharCode(...chunk))
              dump[`${i}|${j}`] = b64
            }
          }
        }
      }
      console.log(dump)
    },
    setChunk: (chunk: XY, chunkData: string) => {
      if (!data[chunk.x]) data[chunk.x] = []

      visibleDirty[chunkey(chunk.x, chunk.y)] = true

      const decoded = new Int8Array(atob(chunkData as unknown as string).split("").map(c => c.charCodeAt(0)))
      data[chunk.x][chunk.y] = decoded
    },
    setType: ({ x, y, z }: XYZ, type: number) => {
      const chunkX = floor(x / 4)
      const chunkY = floor(y / 4)

      if (data[chunkX]?.[chunkY]) {
        const offset = z * 16 + (y - chunkY * 4) * 4 + (x - chunkX * 4)
        data[chunkX][chunkY][offset] = type
      }

      visibleDirty[chunkey(chunkX, chunkY)] = true
    },
    neighbors: (chunk: XY, dist: number = 1) => {
      const neighbors: XY[] = []

      for (let dx = -dist; dx <= dist; dx++) {
        for (let dy = -dist; dy <= dist; dy++) {
          if (!data[chunk.x + dx]?.[chunk.y + dy]) continue
          neighbors.push({ x: chunk.x + dx, y: chunk.y + dy })
        }
      }
      return neighbors
    },
    add: (block: Block) => {
      const chunkX = floor(block.x / 4)
      const chunkY = floor(block.y / 4)

      if (!data[chunkX]?.[chunkY]) {
        // console.error("CHUNK NOT FOUND", chunkX, chunkY)
        return false
      }

      const x = block.x - chunkX * 4
      const y = block.y - chunkY * 4

      const index = block.z * 16 + y * 4 + x

      if (data[chunkX][chunkY][index] === undefined) {
        console.error("INVALID INDEX", index, x, y, block.z)
        return false
      }

      if (data[chunkX][chunkY][index] !== 0) {
        // console.error("BLOCK ALREADY EXISTS", x, y, block.z)
        return false
      }

      data[chunkX][chunkY][index] = block.type

      const key = chunkey(chunkX, chunkY)

      visibleDirty[key] = true

      return true
    },
    addPlan: (plan: BlockPlan) => {
      let success = true
      for (const block of plan) {
        const result = blocks.add(block)
        if (!result) success = false
      }
      return success
    },
    visible: (at: XY[]) => {
      const result: Block[] = []
      const time = performance.now()

      const start = 0
      const end = at.length
      const step = 1

      for (let i = start; i !== end; i += step) {
        const pos = at[i]

        // chunk exists
        const chunk = chunkval(pos.x, pos.y)
        if (!chunk) continue

        // check cache
        const key = `${pos.x}:${pos.y}`
        if (visibleCache[key] && !visibleDirty[key]) {
          result.push(...visibleCache[key])
          continue
        }

        const chunkResult: Block[] = []

        // find blocks in the chunk
        for (let z = 0; z < 32; z++) {
          for (let y = 0; y < 4; y++) {
            for (let x = 0; x < 4; x++) {

              const index = z * 16 + y * 4 + x
              const type = chunk[index]
              if (type === 0) continue

              const thisX = pos.x * 4 + x
              const thisY = pos.y * 4 + y

              // check if the block is visible
              if (
                !val(thisX + 1, thisY, z) || !val(thisX - 1, thisY, z) ||
                !val(thisX, thisY + 1, z) || !val(thisX, thisY - 1, z) ||
                !val(thisX, thisY, z + 1) || !val(thisX, thisY, z - 1)
              ) {
                const ijk = { x: x + pos.x * 4, y: y + pos.y * 4, z }

                const block: Block = { ...ijk, type }
                chunkResult.push(block)
              }
            }
          }
        }
        visibleCache[key] = chunkResult
        result.push(...chunkResult)
      }

      visibleDirty = {}
      logPerf("BlockData.visible", time)
      return result
    },
    invalidate: () => {
      for (const value of keys(visibleDirty)) {
        visibleDirty[value] = true
      }
    },
    atIJK: (ijk: XYZ) => {
      const chunkX = floor(ijk.x / 4)
      const chunkY = floor(ijk.y / 4)

      const indexX = ijk.z * 16 + (ijk.y - chunkY * 4) * 4 + (ijk.x - chunkX * 4)

      if (data[chunkX]?.[chunkY]?.[indexX] === undefined) return undefined

      return data[chunkX]?.[chunkY]?.[indexX]
    },
    needsUpdate: () => {
      return Boolean(keys(visibleDirty).length)
    },
    loadMap: (map: Record<string, string>) => {
      for (const chunk in map) {
        const [x, y] = chunk.split("|").map(Number)

        blocks.setChunk({ x, y }, map[chunk])
      }
    },
    remove: ({ x, y, z }) => {
      const chunkX = floor(x / 4)
      const chunkY = floor(y / 4)

      if (!data[chunkX]?.[chunkY]) {
        // console.error("CHUNK NOT FOUND", chunkX, chunkY)
        return
      }

      const xIndex = x - chunkX * 4
      const yIndex = y - chunkY * 4

      const index = z * 16 + yIndex * 4 + xIndex

      if (data[chunkX][chunkY][index] === undefined) {
        console.error("INVALID INDEX", index, xIndex, yIndex, z)
        return
      }

      // const blockType = BlockTypeString[data[chunkX][chunkY][index]]

      // // spawn item
      // if (blockType && world) {
      //   const playerCharacter = world.client?.character()
      //   if (playerCharacter) {
      //     const item = BlockItem(blockType)({ character: playerCharacter, id: randomHash() })
      //     const xy = intToXY(x, y)
      //     item.components.position.data.follows = undefined
      //     item.components.position.setPosition({ ...xy, z: (z + 1) * 21 })
      //     item.components.item.dropped = true

      //     world.addEntity(item)
      //   }
      // }

      data[chunkX][chunkY][index] = 0

      const key = chunkey(chunkX, chunkY)
      visibleDirty[key] = true

      // check if neighbors are also dirty
      if (x % 4 === 0) visibleDirty[chunkey(chunkX - 1, chunkY)] = true
      if (x % 4 === 3) visibleDirty[chunkey(chunkX + 1, chunkY)] = true
      if (y % 4 === 0) visibleDirty[chunkey(chunkX, chunkY - 1)] = true
      if (y % 4 === 3) visibleDirty[chunkey(chunkX, chunkY + 1)] = true
    }
  }

  return blocks
}

export const spawnChunk = (chunk: XY, world: World) => {
  const size = 4
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {

      const x = i + chunk.x * size
      const y = j + chunk.y * size

      let height = world.random.noise({ x, y, factor: 15, octaves: 3 })

      for (let z = 0; z < height; z++) {

        world.blocks.add({ x, y, z, type: 1 })

        if (z === height - 1 && world.random.int(200) === 1) {

          let height = world.random.int(2) + 4
          if (world.random.int(4) === 1) {
            height += world.random.int(5)
          }

          const t = world.random.int(2) === 1 ? "oak" : "spruce"
          const fluffy = world.random.int(2) === 1

          world.blocks.addPlan(BlockTree({ x, y, z }, height, t, fluffy))

          world.trees.push({ x: x * 0.3, y: y * 0.3, z: (z + height) * 0.3 + 0.15 })
        }
      }
    }
  }
}

// export const spawnTiny = () => {
//   const num = 8
//   for (let i = 0; i < num; i++) {
//     for (let j = 0; j < num; j++) {
//       blocks.add({ x: i + 5, y: j + 5, z: 0, type: 1 })
//     }
//   }

//   blocks.add({ x: 9, y: 9, z: 1, type: 2 })
// }

export const spawnTerrain = (world: World, num: number = 10) => {
  const time = performance.now()
  for (let i = 0; i < num; i++) {
    for (let j = 0; j < num; j++) {
      const chunk = { x: i, y: j }
      spawnChunk(chunk, world)
    }
  }
  logPerf("spawnTerrain", time)
}

export const spawnFlat = (world: World, chunks = 12) => {
  for (let i = 2; i < chunks + 2; i++) {
    for (let j = 2; j < chunks + 2; j++) {
      for (let z = 0; z < 1; z++) {
        for (let x = 0; x < 4; x++) {
          for (let y = 0; y < 4; y++) {
            world.blocks.add({ x: i * 4 + x, y: j * 4 + y, z, type: 4 })
          }
        }
      }
    }
  }
}
