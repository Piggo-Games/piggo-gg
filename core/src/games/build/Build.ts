import {
  BlockMeshSystem, BlockPhysicsSystem, Crosshair, EscapeMenu, GameBuilder,
  HtmlChat, HtmlLagText, HUDSystem, HUDSystemProps, InventorySystem,
  SpawnSystem, Sun, ThreeCameraSystem, ThreeNametagSystem, ThreeSystem
} from "@piggo-gg/core"
import { Bob } from "./Bob"

type BuildSettings = {
  showCrosshair: boolean
}

export const Build: GameBuilder<{}, BuildSettings> = {
  id: "build",
  init: (world) => ({
    id: "build",
    netcode: "rollback",
    renderer: "three",
    settings: {
      showCrosshair: true
    },
    state: {},
    systems: [
      SpawnSystem(Bob),
      BlockPhysicsSystem("global"),
      BlockPhysicsSystem("local"),
      ThreeCameraSystem(),
      HUDSystem(controls),
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

