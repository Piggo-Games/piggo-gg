import {
  CraftState, Entity, Networked, NPC, Position,
  World, XYZ, XYZdistance, XYZequal, Three
} from "@piggo-gg/core"
import { Mesh } from "three"

export const Apple = ({ id }: { id: string }): Entity<Position> => {

  let eaten = false

  let treeIndex: number = -1
  let tree: XYZ = { x: 0, y: 0, z: 0 }

  const randomSpot = (world: World): XYZ => {
    treeIndex = world.random.int(world.trees.length - 1)

    tree = world.trees[treeIndex]

    const a = 0.52
    const b = 0.3
    const z = -0.24

    const randomSpot = world.random.choice([
      { x: a, y: 0, z: 0 }, { x: -a, y: 0, z: 0 },
      { x: 0, y: a, z: 0 }, { x: 0, y: -a, z: 0 },
      { x: b, y: 0, z }, { x: -b, y: 0, z },
      { x: 0, y: b, z }, { x: 0, y: -b, z }
    ])
    return { x: tree.x + randomSpot.x, y: tree.y + randomSpot.y, z: tree.z + randomSpot.z }
  }

  const apple = Entity<Position | Three>({
    id,
    components: {
      position: Position(),
      networked: Networked(),
      three: Three({
        init: async ({ o, three }) => {
          three.gLoader.load("apple.glb", (glb) => {
            glb.scene.scale.set(0.16, 0.16, 0.16)
            glb.scene.position.set(apple.components.position.data.x, apple.components.position.data.z, apple.components.position.data.y)

            o.push(glb.scene)

            glb.scene.traverse((child) => {
              if (child instanceof Mesh) {
                child.castShadow = true
                child.receiveShadow = true
              }
            })
          })
        }
      }),
      npc: NPC({
        behavior: (_, world) => {
          // relocate the apple
          if (treeIndex === -1 || eaten || !world.trees[treeIndex] || !XYZequal(world.trees[treeIndex], tree)) {
            apple.components.position.setPosition(randomSpot(world))
            eaten = false
          }

          // set mesh position
          const { x, y, z } = apple.components.position.data

          // check if eaten
          for (const player of world.players()) {
            const character = player.components.controlling?.getCharacter(world)
            if (!character) continue

            const { position } = character.components
            const dist = XYZdistance(position.data, { x, y, z })

            if (dist < 0.16 && !eaten) {
              eaten = true

              // sound effect
              world.client?.sound.play({ name: "eat", start: 0.3, threshold: { pos: { x, y }, distance: 5 } })

              if (position.data.flying) return

              // update state
              const state = world.game.state as CraftState

              // if (!state.applesEaten[player.id]) {
              //   state.applesEaten[player.id] = 1
              // } else {
              //   state.applesEaten[player.id] += 1
              // }

              // if (state.phase === "play") {
              //   player.components.pc.data.points += 1

              //   if (state.applesEaten[player.id] >= 10) {
              //     character.components.position.data.flying = true
              //   }
              // }
            }
          }
        }
      })
    }
  })

  return apple
}
