import {
  BlockMeshSysten, BlockPhysicsSystem, Crosshair, ThreeNametagSystem,
  EscapeMenu, GameBuilder, Hitmarker, HtmlChat, HUDSystem,
  InventorySystem, logPerf, min, Sky, SpawnSystem, Sun, SystemBuilder,
  ThreeCameraSystem, ThreeSystem, DummyPlayer, HtmlFeed, DummyPlayer2
} from "@piggo-gg/core"
import { Sarge } from "./Sarge"
import { RetakeMap, RetakeMapColoring } from "./RetakeMap"
import { HealthAmmo } from "./HealthAmmo"
import { PhaseBanner } from "./PhaseBanner"
import { MobileUI } from "../craft/MobileUI"
import { Scoreboard } from "./Scoreboard"

export type StrikeState = {
  jumped: string[]
  phase: "warmup" | "round-spawn" | "round-play" | "round-done" | "game-done"
  phaseChange: number | undefined
}

export type StrikeSettings = {
  showControls: boolean
  showCrosshair: boolean
  showNametags: boolean
  mouseSensitivity: number
}

export const Strike: GameBuilder<StrikeState, StrikeSettings> = {
  id: "strike",
  init: (world) => ({
    id: "strike",
    netcode: "rollback",
    renderer: "three",
    settings: {
      ambientSound: true,
      showControls: true,
      showCrosshair: true,
      showNametags: true,
      mouseSensitivity: 1
    },
    state: {
      jumped: [],
      phase: "warmup",
      phaseChange: undefined
    },
    systems: [
      SpawnSystem(Sarge),
      BlockPhysicsSystem("global"),
      BlockPhysicsSystem("local"),
      ThreeCameraSystem(),
      StrikeSystem,
      // HUDSystem,
      ThreeNametagSystem,
      ThreeSystem,
      InventorySystem,
      BlockMeshSysten,
      HUDSystem
    ],
    entities: [
      Crosshair(),
      Hitmarker(),
      Scoreboard(),
      EscapeMenu(world),
      // UIProfile(),
      // CraftScoreboard(),
      HtmlChat(),
      HtmlFeed(),
      HealthAmmo(),
      Sun({
        bounds: { left: -10, right: 12, top: 0, bottom: -9 },
        // pos: { x: 200, y: 200, z: 200 }
      }),
      Sky(),
      DummyPlayer(),
      // DummyPlayer2(),
      PhaseBanner()
    ]
  })
}

const StrikeSystem = SystemBuilder({
  id: "StrikeSystem",
  init: (world) => {

    world.blocks.loadMap(RetakeMap)
    world.blocks.coloring = RetakeMapColoring

    const mobileUI = MobileUI(world)

    return {
      id: "StrikeSystem",
      query: [],
      priority: 3,
      onTick: () => {
        const state = world.state<StrikeState>()
        const settings = world.settings<StrikeSettings>()

        if (world.client && !world.client.mobile) {
          world.client.menu = document.pointerLockElement === null
        }

        mobileUI?.update()

        const players = world.players().filter(p => !p.id.includes("dummy"))

        if (world.mode === "server" && state.phaseChange === undefined && state.phase === "warmup" && players.length > 0) {
          const notReady = players.filter(p => !p.components.pc.data.ready)
          if (notReady.length === 0) {
            state.phaseChange = world.tick + 120
          }
        }

        if (state.phaseChange && world.tick >= state.phaseChange) {
          state.phase = "round-spawn"
          state.phaseChange = undefined
        }

        const t1 = performance.now()
        for (const player of players) {
          const character = player.components.controlling?.getCharacter(world)
          if (!character) continue

          const { position, health } = character.components
          const { z, rotation, standing, velocity } = position.data

          // jump state cleanup
          if (standing && velocity.z <= 0) {
            state.jumped = state.jumped.filter(id => id !== character.id)
          }

          // reset rotation
          position.data.rotating = 0
          if (rotation < 0) position.data.rotating = min(0.08, -rotation)
          if (rotation > 0) position.data.rotating = -1 * min(0.08, rotation)

          // fell off the map
          if (z < -4) {
            position.setPosition({ x: 9.9, y: 15, z: 2 })
          }
        }
        logPerf("player positions", t1)
      }
    }
  }
})
