import {
  BlockMeshSystem, BlockPhysicsSystem, Crosshair, EscapeMenu, GameBuilder,
  HtmlChat, HtmlLagText, HUDSystem, HUDSystemProps, InventorySystem, spawnFlat,
  SpawnSystem, Sun, SystemBuilder, ThreeCameraSystem, ThreeNametagSystem, ThreeSystem
} from "@piggo-gg/core"
import { Bob } from "./Bob"

type BuildSettings = {
  showCrosshair: boolean
  showControls: boolean
}

type BuildState = {
  jumped: string[]
}

export const Build: GameBuilder<BuildState, BuildSettings> = {
  id: "build",
  init: (world) => ({
    id: "build",
    netcode: "rollback",
    renderer: "three",
    settings: {
      showCrosshair: true,
      showControls: true
    },
    state: {
      jumped: []
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
      EscapeMenu(world),
      HtmlChat(),
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

      }
    }
  }
})

const controls: HUDSystemProps = {
  clusters: [
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
