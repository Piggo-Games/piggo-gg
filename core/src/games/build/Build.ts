import {
  BlockColor, BlockMeshSystem, BlockPhysicsSystem, Crosshair, EscapeMenu,
  GameBuilder, HtmlChat, HtmlLagText, HUDSystem, HUDSystemProps,
  InventorySystem, Sky, spawnFlat, SpawnSystem, Sun, SystemBuilder,
  ThreeCameraSystem, ThreeNametagSystem, ThreeSystem
} from "@piggo-gg/core"
import { Bob } from "./Bob"

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
  id: "build",
  init: (world) => ({
    id: "build",
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
      Sun({
        bounds: { left: -10, right: 12, top: 0, bottom: -9 },
      }),
      HtmlLagText()
    ]
  })
}

const BuildSystem = SystemBuilder({
  id: "BuildSystem",
  init: (world) => {

    spawnFlat(world)

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
          const { velocity, standing } = position.data

          // fell off the map
          if (position.data.z < -8) {
            position.setPosition({ x: 10, y: 10, z: 8 })
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
      label: "place",
      buttons: [["mb2"]]
    },
    {
      label: "shoot",
      buttons: [["mb1"]]
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
