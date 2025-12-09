import {
  Background, Cursor, EscapeMenu, GameBuilder, HUDSystem, HUDSystemProps,
  HtmlChat, HtmlFpsText, HtmlLagText, InventorySystem, ItemSystem,
  NametagSystem, PhysicsSystem, PixiCameraSystem, PixiDebugSystem,
  PixiRenderSystem, ShadowSystem, SpawnSystem, SystemBuilder, Water2D, screenWH
} from "@piggo-gg/core"
import { StarGuy } from "./enemies/StarGuy"
import { Gary } from "./Gary"
import { Beach, BeachWall, OuterBeachWall } from "./terrain/Beach"
import { Flag } from "./terrain/Flag"
import { Pier } from "./terrain/Pier"

const arenaWidth = 500

export type GambaState = {
  round: number
  die1: number | null
  die2: number | null
}

export type GambaSettings = {
  showControls: boolean
}

export const Gamba: GameBuilder<GambaState, GambaSettings> = {
  id: "gamba",
  init: (world) => ({
    id: "gamba",
    netcode: "rollback",
    renderer: "pixi",
    settings: {
      showControls: true
    },
    state: {
      round: 1,
      die1: null,
      die2: null
    },
    systems: [
      PhysicsSystem("local"),
      PhysicsSystem("global"),
      SpawnSystem({ spawner: Gary, pos: { x: 0, y: 0, z: 0 } }),
      GambaSystem,
      PixiRenderSystem,
      HUDSystem(controls),
      PixiCameraSystem(),
      PixiDebugSystem,
      InventorySystem,
      ItemSystem,
      ShadowSystem,
      NametagSystem
    ],
    entities: [
      Background({ rays: true }),
      BeachWall(),
      OuterBeachWall(),
      Beach(),
      Pier(),
      Flag(),
      StarGuy(),
      Water2D(),

      Cursor(),
      EscapeMenu(world),
      HtmlChat(),
      HtmlLagText(),
      HtmlFpsText(),
    ]
  })
}

const GambaSystem = SystemBuilder({
  id: "GambaSystem",
  init: (world) => {

    let lastScale = 0

    const updateScale = () => {
      if (!world.pixi) return

      const { w } = screenWH()
      const targetScale = Math.min(3.4, Math.max(2, w / (arenaWidth * 1.3)))

      if (Math.abs(targetScale - lastScale) > 0.02) {
        world.pixi.camera.scaleTo(targetScale)
        lastScale = targetScale
      }
    }

    updateScale()

    return {
      id: "GambaSystem",
      query: [],
      priority: 6,
      onTick: () => {

      }
    }
  }
})

const controls: HUDSystemProps = {
  direction: "row",
  clusters: [
    {
      label: "roll",
      buttons: [["mb1"]]
    },
    {
      label: "move",
      buttons: [
        ["A", "S", "D"],
        ["W"]
      ]
    },
    {
      label: "menu",
      buttons: [["esc"]]
    }
  ]
}
