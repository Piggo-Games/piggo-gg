import {
  BlockTypeString, ClientSystemBuilder, entries, GrassTexture,
  LeafTexture, logPerf, MarbleTexture, OakTexture, SpruceTexture
} from "@piggo-gg/core"
import { BoxGeometry, Color, InstancedMesh, InstancedMeshEventMap, MeshPhysicalMaterial, Object3D } from "three"

export type BlockMesh = InstancedMesh<BoxGeometry, MeshPhysicalMaterial[], InstancedMeshEventMap>

export const BlockMesh = (maxCount: number): BlockMesh => {
  const mat = () => new MeshPhysicalMaterial({
    vertexColors: false, visible: false, specularIntensity: 0.05, wireframe: false
  })

  const mesh = new InstancedMesh(
    new BoxGeometry(0.3, 0.3, 0.3),
    [mat(), mat(), mat(), mat(), mat(), mat()],
    maxCount
  )

  mesh.castShadow = true
  mesh.receiveShadow = true
  mesh.frustumCulled = false

  return mesh
}

export const BlockMeshSysten = ClientSystemBuilder({
  id: "BlockMeshSystem",
  init: (world) => {
    const { three } = world
    if (!three) return

    let grass = GrassTexture(BlockMesh(32000), three)
    let leaf = LeafTexture(BlockMesh(5000), three)
    let oak = OakTexture(BlockMesh(5000), three)
    let spruce = SpruceTexture(BlockMesh(5000), three)
    let marble = MarbleTexture(BlockMesh(4000), three)

    let rendered = false

    three.scene.add(grass, leaf, oak, spruce, marble)

    return {
      id: "BlockMeshSystem",
      query: [],
      priority: 10,
      onTick: () => {
        let playerChunk = { x: 0, y: 0 }

        if (world.blocks.needsUpdate()) rendered = false

        const t3 = performance.now()
        if (!rendered) {
          const dummy = new Object3D()

          const neighbors = world.blocks.neighbors(playerChunk, 24)
          const chunkData = world.blocks.visible(neighbors)

          let spruceCount = 0
          let oakCount = 0
          let leafCount = 0
          let marbleCount = 0
          let otherCount = 0

          // for each block
          for (let i = 0; i < chunkData.length; i++) {
            const { x, y, z } = chunkData[i]
            const type = BlockTypeString[chunkData[i].type]

            dummy.position.set(x * 0.3, z * 0.3 + 0.15, y * 0.3)
            dummy.updateMatrix()

            if (type === "spruceLeaf") {
              leaf.setColorAt(leafCount, new Color(0x0099aa))
              leaf.setMatrixAt(leafCount, dummy.matrix)
              leafCount++
            } else if (type === "oakLeaf") {
              leaf.setColorAt(leafCount, new Color(0x33dd77))
              leaf.setMatrixAt(leafCount, dummy.matrix)
              leafCount++
            } else if (type === "oak") {
              oak.setColorAt(oakCount, new Color(0xffaa99))
              oak.setMatrixAt(oakCount, dummy.matrix)
              oakCount++
            } else if (type === "spruce") {
              spruce.setColorAt(spruceCount, new Color(0xbb66ff))
              spruce.setMatrixAt(spruceCount, dummy.matrix)
              spruceCount++
            } else if (type === "marble") {

              if (world.blocks.coloring[`${x},${y},${z}`]) {
                const color = new Color(world.blocks.coloring[`${x},${y},${z}`])
                marble.setColorAt(marbleCount, color)
              } else {
                marble.setColorAt(marbleCount, new Color(z === 0 ? 0xd2b48c : 0xbbbbbb))
              }

              marble.setMatrixAt(marbleCount, dummy.matrix)
              marbleCount++
            } else {
              grass.setMatrixAt(otherCount, dummy.matrix)
              otherCount++
            }
          }

          grass.instanceMatrix.needsUpdate = true
          spruce.instanceMatrix.needsUpdate = true
          oak.instanceMatrix.needsUpdate = true
          leaf.instanceMatrix.needsUpdate = true
          marble.instanceMatrix.needsUpdate = true

          if (spruce.instanceColor) spruce.instanceColor.needsUpdate = true
          if (oak.instanceColor) oak.instanceColor.needsUpdate = true
          if (leaf.instanceColor) leaf.instanceColor.needsUpdate = true
          if (marble.instanceColor) marble.instanceColor.needsUpdate = true

          grass.count = otherCount
          leaf.count = leafCount
          oak.count = oakCount
          spruce.count = spruceCount
          marble.count = marbleCount

          rendered = true
        }
        logPerf("render blocks", t3)
      }
    }
  }
})
