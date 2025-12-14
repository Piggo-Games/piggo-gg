import {
  Background, Cursor, EscapeMenu, GameBuilder, HUDSystem, HUDSystemProps,
  HtmlChat, HtmlFpsText, HtmlLagText, InventorySystem, ItemSystem,
  NametagSystem, PhysicsSystem, PixiCameraSystem, PixiDebugSystem,
  PixiRenderSystem, ShadowSystem, SpawnSystem, SystemBuilder, Water2D, screenWH
} from "@piggo-gg/core"
import { Patrick } from "./enemies/Patrick"
import { Gary } from "./Gary"
import { Beach, BeachWall, OuterBeachWall } from "./terrain/Beach"
import { Flag } from "./terrain/Flag"
import { Pier } from "./terrain/Pier"
import { NumBoard } from "./ui/NumBoard"
import { Scroll } from "./ui/Scroll"

const arenaWidth = 500

export type GambaState = {
  round: number
  shooter: string | null
  die1: number | null
  die2: number | null
  rolled: number | null
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
      shooter: null,
      die1: null,
      die2: null,
      rolled: null
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
      Patrick(),
      Water2D(),

      NumBoard(),
      Scroll(),

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
        const state = world.state<GambaState>()

        if (state.die1 && state.die2 && state.rolled === null) {
          const result = state.die1 + state.die2
          state.rolled = result

          // damage on 7
          if (state.rolled === 7 && state.shooter) {
            const character = world.entity(state.shooter)
            if (character) {
              character.components.renderable!.setOverlay({ alpha: 0.7, color: 0xff4444 })
            }
          }
        }

        if (state.die1 === null || state.die2 === null) {
          state.rolled = null
        }

        // shooter
        const characters = world.characters()
        if (characters.length === 1) {
          state.shooter = characters[0].id
        }
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
