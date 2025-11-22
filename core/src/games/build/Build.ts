import {
  BlockColor, BlockMeshSystem, BlockPhysicsSystem, Collider, Crosshair, Entity, EscapeMenu,
  GameBuilder, HtmlChat, HtmlLagText, HUDSystem, HUDSystemProps,
  InventorySystem, Position, Sky, spawnFlat, SpawnSystem, Sun, SystemBuilder,
  Three,
  ThreeCameraSystem, ThreeNametagSystem, ThreeSystem, Water
} from "@piggo-gg/core"
import { Bob } from "./Bob"
import { Group, Mesh, Object3DEventMap } from "three"

export type BuildSettings = {
  showCrosshair: boolean
  showControls: boolean
  showNametags: boolean
  blockColor: BlockColor
}

export type BuildState = {
  doubleJumped: string[]
}

export const Build: GameBuilder<BuildState, BuildSettings> = {
  id: "builders",
  init: (world) => ({
    id: "builders",
    netcode: "rollback",
    renderer: "three",
    settings: {
      showCrosshair: true,
      showControls: true,
      showNametags: true,
      blockColor: "white"
    },
    state: {
      doubleJumped: []
    },
    systems: [
      SpawnSystem(Bob),
      BlockPhysicsSystem("global"),
      BlockPhysicsSystem("local"),
      ThreeCameraSystem(),
      HUDSystem(controls),
      BuildSystem,
      ThreeNametagSystem,
      ThreeSystem,
      InventorySystem,
      BlockMeshSystem
    ],
    entities: [
      Crosshair(),
      // HtmlInventory(),
      EscapeMenu(world),
      HtmlChat(),
      Sky(),
      Water(),
      Sun({
        bounds: { left: -10, right: 12, top: 0, bottom: -9 },
      }),
      HtmlLagText(),
      Pig()
    ]
  })
}

const BuildSystem = SystemBuilder({
  id: "BuildSystem",
  init: (world) => {

    spawnFlat(world, 11)

    return {
      id: "BuildSystem",
      query: [],
      priority: 3,
      onTick: () => {

        const state = world.game.state as BuildState

        if (world.client && !world.client.mobile) {
          world.client.menu = document.pointerLockElement === null
        }

        const players = world.players()

        for (const player of players) {
          const character = player.components.controlling.getCharacter(world)
          if (!character) continue

          const { position } = character.components
          const { velocity, standing, z, flying } = position.data

          // fell off the map
          if (z < -5 && !flying) {
            position.setPosition({ x: 6, y: 6, z: 8 })
          }

          // double-jump state cleanup
          if (standing) {
            state.doubleJumped = state.doubleJumped.filter(id => id !== character.id)
          }
        }

      }
    }
  }
})

const controls: HUDSystemProps = {
  clusters: [
    {
      label: "shoot|color|place",
      buttons: [["mb1", "mb3", "mb2"]],
      fontSize: "16px"
    },
    {
      label: "place area",
      buttons: [["x"]],
    },
    {
      label: "fly",
      buttons: [["f"]]
    },
    {
      label: "move",
      buttons: [
        ["A", "S", "D"],
        ["W"]
      ]
    },
    {
      label: "jump",
      buttons: [["spacebar"]]
    }
  ]
}

export const Pig = () => {

  let mesh: Group<Object3DEventMap> | undefined = undefined

  const pig = Entity<Position>({
    id: "pig",
    components: {
      position: Position({ x: 4, y: 4, z: 2, gravity: 0.003 }),
      collider: Collider({ shape: "ball", radius: 0.1 }),
      three: Three({
        onRender: ({ delta, world }) => {
          const pos = pig.components.position.interpolate(world, delta)

          if (mesh) {
            mesh.position.set(pos.x, pos.z, pos.y)
          }
        },
        init: async (o, _, __, three) => {
          three.gLoader.load("pig.gltf", (gltf) => {

            mesh = gltf.scene
            mesh.animations = gltf.animations
            mesh.frustumCulled = false
            mesh.scale.set(0.0125, 0.0125, 0.0125)

            mesh.traverse((child) => {
              if (child instanceof Mesh) {
                child.castShadow = true
                child.receiveShadow = true
              }
            })

            o.push(mesh)
          })
        }
      })
    }
  })

  return pig
}
