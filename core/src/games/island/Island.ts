import {
  BlockColor, BlockMeshSystem, BlockPhysicsSystem, Crosshair, EscapeMenu,
  GameBuilder, HtmlChat, HtmlLagText, HUDSystem, HUDSystemProps,
  InventorySystem, Sky, spawnFlat, SpawnSystem, Sun, SystemBuilder,
  ThreeCameraSystem, ThreeNametagSystem, ThreeSystem, Water
} from "@piggo-gg/core"
import { Bob } from "./Bob"
import { Pig } from "./Pig"

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
      BlockMeshSystem
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
      Pig()
    ]
  })
}

const IslandSystem = SystemBuilder({
  id: "IslandSystem",
  init: (world) => {

    spawnFlat(world, 11)

    return {
      id: "IslandSystem",
      query: [],
      priority: 3,
      onTick: () => {

        const state = world.game.state as IslandState

        if (world.client && !world.client.mobile) {
          world.client.menu = document.pointerLockElement === null
        }

        const players = world.players()

        for (const player of players) {
          const character = player.components.controlling.getCharacter(world)
          if (!character) continue

          const { position } = character.components
          const { standing, z, flying } = position.data

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
