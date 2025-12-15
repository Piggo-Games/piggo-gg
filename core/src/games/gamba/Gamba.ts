import {
  Background, Cursor, EscapeMenu, GameBuilder, HUDSystem, HUDSystemProps, HtmlChat,
  HtmlFpsText, HtmlLagText, InventorySystem, ItemSystem, PixiNametagSystem,
  PhysicsSystem, PixiCameraSystem, PixiDebugSystem, PixiRenderSystem, ShadowSystem,
  SpawnSystem, SystemBuilder, Water2D, World, screenWH, DummyPlayer
} from "@piggo-gg/core"
import { Patrick } from "./enemies/Patrick"
import { Gary } from "./Gary"
import { Beach, BeachWall, OuterBeachWall } from "./terrain/Beach"
import { Flag } from "./terrain/Flag"
import { Pier } from "./terrain/Pier"
import { NumBoard } from "./ui/NumBoard"
import { Scroll, ScrollProps } from "./ui/Scroll"

const arenaWidth = 500

export type D6 = 1 | 2 | 3 | 4 | 5 | 6
export type Roll = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 67

export type GambaState = {
  round: number
  shooter: string | null
  die1: D6 | null
  die2: D6 | null
  rolled: Roll | null
  selectedAbility: string | null
}

export type GambaSettings = {
  showControls: boolean
}

const scrollAbilities: ScrollProps[] = [
  {
    id: "rally",
    title: "Rally",
    description: "allies take 1 less DMG per hit until your next turn",
    manaCost: 1,
    position: { x: 10, y: 100 }
  },
  {
    id: "slice",
    title: "Slice",
    description: "enemies take 1D6 extra DMG per hit until your next turn",
    manaCost: 1,
    position: { x: 110, y: 100 }
  }
]

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
      rolled: null,
      selectedAbility: null
    },
    systems: [
      PhysicsSystem("local"),
      PhysicsSystem("global"),
      SpawnSystem({ spawner: Gary, pos: { x: 0, y: 0, z: 0 } }),
      GambaSystem,
      PixiRenderSystem,
      HUDSystem(controls(world)),
      PixiCameraSystem(),
      PixiDebugSystem,
      InventorySystem,
      ItemSystem,
      ShadowSystem,
      PixiNametagSystem
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

      // DummyPlayer(),

      NumBoard(),
      ...scrollAbilities.map((scroll) => Scroll(scroll)),

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
      const zoom = Math.min(3.4, Math.max(2, w / (arenaWidth * 1.1)))

      if (Math.abs(zoom - lastScale) > 0.02) {
        world.pixi.camera.scaleTo(zoom)
        lastScale = zoom
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
          let result = state.die1 + state.die2
          if ((state.die1 === 6 && state.die2 === 1) || (state.die1 === 1 && state.die2 === 6)) {
            result = 67
          }

          state.rolled = result as Roll

          // damage on 7
          if (state.rolled === 7 && state.shooter) {
            const character = world.entity(state.shooter)
            if (character) {
              // character.components.renderable!.setOverlay({ alpha: 0.7, color: 0xff4444 })
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

const controls = (world: World): HUDSystemProps => ({
  direction: "row",
  from: { top: 20, left: 20 },
  clusters: [
    {
      label: "menu",
      buttons: [["esc"]]
    },
    {
      label: "move",
      buttons: [
        ["A", "S", "D"],
        ["W"]
      ]
    },
    {
      label: "roll",
      buttons: [["mb1"]]
    }
  ]
})
