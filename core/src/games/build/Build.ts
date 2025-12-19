import {
  BlockColor, BlockMeshSystem, BlockPhysicsSystem, Crosshair, EscapeMenu,
  GameBuilder, HtmlChat, HtmlFpsText, HtmlLagText, HUDSystem, HUDSystemProps,
  InventorySystem, PI, Sky, SpawnSystem, Sun, SystemBuilder, ThreeCameraSystem,
  ParticleSystem, ThreeNametagSystem, ThreeSystem, Water, Hitmarker, DummyPlayer
} from "@piggo-gg/core"
import { Bob } from "./Bob"
import { Pig } from "./Pig"
import { MobileUI } from "../craft/MobileUI"
import { BuildMap, BuildMapColoring } from "./BuildMap"
import { Shork } from "./Shork"

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
      SpawnSystem({ spawner: Bob, pos: { x: -6, y: 6.6, z: 2 } }),
      BlockPhysicsSystem("global"),
      BlockPhysicsSystem("local"),
      ThreeCameraSystem(),
      HUDSystem(controls),
      BuildSystem,
      ThreeNametagSystem,
      ThreeSystem,
      InventorySystem,
      BlockMeshSystem,
      ParticleSystem
    ],
    entities: [
      Crosshair(),
      Hitmarker(),
      // HtmlInventory(),
      EscapeMenu(world),
      HtmlChat(),
      Sky(),
      Water(),
      Sun(),
      HtmlLagText(),
      HtmlFpsText(),
      Pig(),
      Shork(),
      // DummyPlayer()
    ]
  })
}

const BuildSystem = SystemBuilder({
  id: "BuildSystem",
  init: (world) => {

    world.blocks.loadMap(BuildMap)
    world.blocks.coloring = BuildMapColoring

    const mobileUI = MobileUI(world)

    if (world.client) world.client.controls.localAim.x = PI / 2 * 2.5

    return {
      id: "BuildSystem",
      query: [],
      priority: 3,
      onTick: () => {

        const state = world.game.state as BuildState

        if (world.client && !world.client.mobile) {
          world.client.menu = document.pointerLockElement === null
        }

        mobileUI?.update()

        const players = world.players()

        for (const player of players) {
          const character = player.components.controlling.getCharacter(world)
          if (!character) continue

          const { position } = character.components
          const { standing, z, flying } = position.data

          // handle swimming
          if (flying) {
            position.data.swimming = false
          } else if (z < -0.2) {
            position.data.swimming = true

            // can't double-jump
            if (!state.doubleJumped.includes(character.id)) state.doubleJumped.push(character.id)
          } else if (z >= 0) {
            position.data.swimming = false
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
      label: "place area",
      buttons: [["x"]]
    },
    {
      label: "fly",
      buttons: [["f"]]
    },
    {
      label: "shoot|color|place",
      buttons: [["mb1","mb3","mb2"]],
      fontSize: "16px"
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
    },
    {
      label: "menu",
      buttons: [["esc"]]
    }
  ]
}
