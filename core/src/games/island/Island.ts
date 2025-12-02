import {
  BlockColor, BlockMeshSystem, BlockPhysicsSystem, Crosshair, EscapeMenu,
  GameBuilder, HtmlChat, HtmlFpsText, HtmlLagText, HUDSystem, HUDSystemProps,
  InventorySystem, PI, Sky, SpawnSystem, Sun, SystemBuilder,
  ThreeCameraSystem, ParticleSystem, ThreeNametagSystem, ThreeSystem, Water
} from "@piggo-gg/core"
import { Bob } from "./Bob"
import { Pig } from "./Pig"
import { MobileUI } from "../craft/MobileUI"
import { IslandMap, IslandMapColoring } from "./IslandMap"
import { Shork } from "./Shork"

export type IslandSettings = {
  showCrosshair: boolean
  showControls: boolean
  showNametags: boolean
  blockColor: BlockColor
}

export type IslandState = {
  doubleJumped: string[]
}

export const Island: GameBuilder<IslandState, IslandSettings> = {
  id: "island",
  init: (world) => ({
    id: "island",
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
      IslandSystem,
      ThreeNametagSystem,
      ThreeSystem,
      InventorySystem,
      BlockMeshSystem,
      ParticleSystem
    ],
    entities: [
      Crosshair(),
      // HtmlInventory(),
      EscapeMenu(world),
      HtmlChat(),
      Sky(),
      Water(),
      Sun(),
      HtmlLagText(),
      HtmlFpsText(),
      Pig(),
      Shork()
    ]
  })
}

const IslandSystem = SystemBuilder({
  id: "IslandSystem",
  init: (world) => {

    world.blocks.loadMap(IslandMap)
    world.blocks.coloring = IslandMapColoring

    const mobileUI = MobileUI(world)

    if (world.client) world.client.controls.localAim.x = PI / 2 * 2.5

    return {
      id: "IslandSystem",
      query: [],
      priority: 3,
      onTick: () => {

        const state = world.game.state as IslandState

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
