import {
  arrHash,
  Block, BlockColor, BlockPlan, BlockTree, floor, keys, logPerf, World, XY, XYZ, XYZstring
} from "@piggo-gg/core"

export type BlockData = {
  coloring: Record<XYZstring, BlockColor>
  add: (block: Block) => boolean
  addPlan: (plan: BlockPlan) => boolean
  clear: () => void
  dump: () => void
  setChunk: (chunk: XY, data: string) => void
  setType: (ijk: XYZ, type: number) => void
  atIJK: (ijk: XYZ) => number | undefined
  neighbors: (chunk: XY, dist?: number) => XY[]
  invalidate: () => void
  loadMap: (map: Record<string, string>) => void
  remove: (xyz: XYZ) => void
  needsUpdate: () => boolean
  visible: (at: XY[]) => Block[]
}

const width = 4
const area = width * width

export const BlockData = (): BlockData => {

  let data: Int8Array[][] = []
  let chunkHashes: Record<string, number> = {}

  let visibleCache: Record<string, Block[]> = {}
  let visibleDirty: Record<string, boolean> = {}

  const chunkey = (x: number, y: number) => `${x}:${y}`
  const chunkval = (x: number, y: number) => data[x]?.[y]

  const val = (x: number, y: number, z: number) => {
    const chunkX = floor(x / width)
    const chunkY = floor(y / width)

    const chunk = chunkval(chunkX, chunkY)
    if (!chunk) return chunk

    const xIndex = x - chunkX * width
    const yIndex = y - chunkY * width
    const index = z * area + yIndex * width + xIndex

    return chunk[index]
  }

  const blocks: BlockData = {
    coloring: {
      // "34,49,3": "mediumseagreen"
    },
    clear: () => {
      data = []
      visibleCache = {}
      visibleDirty = {}
    },
    dump: () => {
      const dump: Record<string, string> = {}

      // const dump: string[] = []
      for (let i = 0; i < data.length; i++) {
        if (!data[i]) continue
        for (let j = 0; j < data[i].length; j++) {
          const chunk = data[i]?.[j]
          if (chunk) {
            const filled = chunk.some(v => v !== 0)
            if (filled) {
              const b64 = btoa(String.fromCharCode(...chunk))
              dump[`${i}|${j}`] = b64
            }
          }
        }
      }
      console.log(data)
      console.log(dump)
    },
    setChunk: (chunk: XY, chunkData: string) => {
      if (!data[chunk.x]) data[chunk.x] = []

      const key = chunkey(chunk.x, chunk.y)

      const decoded = new Int8Array(atob(chunkData as unknown as string).split("").map(c => c.charCodeAt(0)))
      data[chunk.x][chunk.y] = decoded

      chunkHashes[key] = arrHash(decoded)
      visibleDirty[key] = true
    },
    setType: ({ x, y, z }: XYZ, type: number) => {
      const chunkX = floor(x / width)
      const chunkY = floor(y / width)

      if (data[chunkX]?.[chunkY]) {
        const offset = z * area + (y - chunkY * width) * width + (x - chunkX * width)
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
      const chunkX = floor(block.x / width)
      const chunkY = floor(block.y / width)

      if (!data[chunkX]) data[chunkX] = []

      if (!data[chunkX][chunkY]) {
        data[chunkX][chunkY] = new Int8Array(width * width * 32)
      }

      const x = block.x - chunkX * width
      const y = block.y - chunkY * width

      const index = block.z * area + y * width + x

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
          for (let y = 0; y < width; y++) {
            for (let x = 0; x < width; x++) {

              const area = width * width

              const index = z * area + y * width + x
              const type = chunk[index]
              if (type === 0) continue

              const thisX = pos.x * width + x
              const thisY = pos.y * width + y

              // check if the block is visible
              if (
                !val(thisX + 1, thisY, z) || !val(thisX - 1, thisY, z) ||
                !val(thisX, thisY + 1, z) || !val(thisX, thisY - 1, z) ||
                !val(thisX, thisY, z + 1) || !val(thisX, thisY, z - 1)
              ) {
                const ijk = { x: x + pos.x * width, y: y + pos.y * width, z }

                const block: Block = { ...ijk, type }
                chunkResult.push(block)
              }
            }
          }
        }
        visibleCache[key] = chunkResult
        result.push(...chunkResult)
      }

      for (const key of keys(visibleDirty)) {
        visibleDirty[key] = false
      }
      logPerf("BlockData.visible", time)
      return result
    },
    invalidate: () => {
      for (const value of keys(visibleDirty)) {
        visibleDirty[value] = true
      }
    },
    atIJK: (ijk: XYZ) => {
      const chunkX = floor(ijk.x / width)
      const chunkY = floor(ijk.y / width)

      const indexX = ijk.z * area + (ijk.y - chunkY * width) * width + (ijk.x - chunkX * width)

      if (data[chunkX]?.[chunkY]?.[indexX] === undefined) return undefined

      return data[chunkX]?.[chunkY]?.[indexX]
    },
    needsUpdate: () => {
      for (const key of keys(visibleDirty)) {
        if (visibleDirty[key]) {
          return true
        }
      }
      return false
    },
    loadMap: (map: Record<string, string>) => {
      for (const chunk in map) {
        const [x, y] = chunk.split("|").map(Number)

        blocks.setChunk({ x, y }, map[chunk])
      }
    },
    remove: ({ x, y, z }) => {
      const chunkX = floor(x / width)
      const chunkY = floor(y / width)

      if (!data[chunkX]?.[chunkY]) {
        // console.error("CHUNK NOT FOUND", chunkX, chunkY)
        return
      }

      const xIndex = x - chunkX * width
      const yIndex = y - chunkY * width

      const index = z * area + yIndex * width + xIndex

      if (data[chunkX][chunkY][index] === undefined) {
        console.error("INVALID INDEX", index, xIndex, yIndex, z)
        return
      }

      data[chunkX][chunkY][index] = 0

      const key = chunkey(chunkX, chunkY)
      visibleDirty[key] = true

      // check if neighbors are also dirty
      if (x % width === 0) visibleDirty[chunkey(chunkX - 1, chunkY)] = true
      if (x % width === 3) visibleDirty[chunkey(chunkX + 1, chunkY)] = true
      if (y % width === 0) visibleDirty[chunkey(chunkX, chunkY - 1)] = true
      if (y % width === 3) visibleDirty[chunkey(chunkX, chunkY + 1)] = true
    }
  }

  return blocks
}

export const spawnTerrain = (world: World, num: number = 10) => {
  const time = performance.now()
  for (let i = 0; i < num; i++) {
    for (let j = 0; j < num; j++) {
      const chunk = { x: i, y: j }
      spawnTerrainChunk(chunk, world)
    }
  }
  logPerf("spawnTerrain", time)
}

export const spawnTerrainChunk = (chunk: XY, world: World) => {
  const size = width
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

export const spawnFlat = (world: World, chunks = 10) => {
  for (let i = 0; i < chunks; i++) {
    for (let j = 0; j < chunks; j++) {
      for (let z = 0; z < 1; z++) {
        for (let x = 0; x < width; x++) {
          for (let y = 0; y < width; y++) {
            world.blocks.add({ x: i * width + x, y: j * width + y, z, type: 4 })
          }
        }
      }
    }
  }
}
