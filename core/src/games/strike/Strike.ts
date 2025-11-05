import {
  BlockMeshSysten, BlockPhysicsSystem, Crosshair, ThreeNametagSystem,
  EscapeMenu, GameBuilder, Hitmarker, HtmlChat, HUDSystem, InventorySystem,
  logPerf, min, Sky, SpawnSystem, Sun, SystemBuilder, ThreeCameraSystem,
  ThreeSystem, DummyPlayer, HtmlFeed, DummyPlayer2, TeamNumber, XYZR, HtmlLagText,
  HUDSystemProps
} from "@piggo-gg/core"
import { Sarge } from "./Sarge"
import { RetakeMap, RetakeMapColoring } from "./RetakeMap"
import { HealthAmmo } from "./HealthAmmo"
import { PhaseBanner } from "./PhaseBanner"
import { MobileUI } from "../craft/MobileUI"
import { Scoreboard } from "./Scoreboard"

export type StrikeState = {
  jumped: string[]
  phase: "warmup" | "round-start" | "round-play" | "round-end" | "game-end"
  phaseChange: number | null
  round: number | null
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
      phaseChange: null,
      round: null,
    },
    systems: [
      SpawnSystem(Sarge),
      BlockPhysicsSystem("global"),
      BlockPhysicsSystem("local"),
      ThreeCameraSystem(),
      StrikeSystem,
      ThreeNametagSystem,
      ThreeSystem,
      InventorySystem,
      BlockMeshSysten,
      HUDSystem(controls)
    ],
    entities: [
      Crosshair(),
      Hitmarker(),
      Scoreboard(),
      EscapeMenu(world),
      // UIProfile(),
      HtmlChat(),
      HtmlFeed(),
      HealthAmmo(),
      Sun({
        bounds: { left: -10, right: 12, top: 0, bottom: -9 },
        // pos: { x: 200, y: 200, z: 200 }
      }),
      Sky(),
      DummyPlayer(),
      DummyPlayer2(),
      PhaseBanner(),
      HtmlLagText()
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

        const players = world.players()

        if (world.mode === "server" && state.phaseChange === null && state.phase === "warmup") {
          const pcs = players.filter(p => !p.id.includes("dummy"))
          const ready = players.filter(p => p.components.pc.data.ready)

          if (ready.length && ready.length === pcs.length) {
            state.phaseChange = world.tick + 120
          }
        }

        if (state.phaseChange && world.tick >= state.phaseChange) {
          if (state.phase === "warmup") {
            state.phase = "round-start"

            let i = 0
            let j = 0

            // move everyone
            for (const player of players) {
              const character = player.components.controlling?.getCharacter(world)
              if (!character) continue

              const { position, health } = character.components
              const teamNumber = player.components.team.data.team

              const randomPoint = spawnPoints[teamNumber][teamNumber === 1 ? i++ : j++]

              position.setPosition(randomPoint)
              position.data.aim.x = randomPoint.r

              if (health) health.setKDA({ k: 0, d: 0, a: 0 })

              if (world.client?.playerId() === player.id) {
                world.client.controls.localAim.x = randomPoint.r
              }
            }
          }
          state.phaseChange = null
        }

        const t1 = performance.now()
        for (const player of players) {
          const character = player.components.controlling?.getCharacter(world)
          if (!character) continue

          const { position, health } = character.components
          if (!health) continue
          const { z, rotation, standing, velocity } = position.data

          // jump state cleanup
          if (standing && velocity.z <= 0) {
            state.jumped = state.jumped.filter(id => id !== character.id)
          }

          // kda update
          if (health?.dead() && health.data.died === world.tick - 10) {

            const { k, d, a } = health.getKDA()
            health.setKDA({ k, d: d + 1, a })

            const fromPlayer = world.entity(health.data.diedFrom || "")
            const fromCharacter = fromPlayer?.components.controlling?.getCharacter(world)
            if (fromCharacter && fromCharacter.components.health) {
              const kda = fromCharacter.components.health.getKDA()
              fromCharacter.components.health.setKDA({ k: kda.k + 1, d: kda.d, a: kda.a })
            }
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

const spawnPoints: Record<TeamNumber, XYZR[]> = {
  1: [
    { x: 8.1, y: 4.6, z: 1.2, r: 4.2 },
    { x: 13.8, y: 6.6, z: 1.2, r: 1 },
    { x: 15, y: 3, z: 1.2, r: 3.14 },
    { x: 12, y: 5.6, z: 1.2, r: 1.7 },
    { x: 12.7, y: 2.8, z: 1.2, r: 3.8 }
  ],
  2: [
    { x: 7.8, y: 19.5, z: 0.3, r: -0.5 },
    { x: 11, y: 19.5, z: 0.3, r: 0.9 },
    { x: 9.5, y: 17.8, z: 0.3, r: 2 },
    { x: 8, y: 17.8, z: 0.3, r: 4.3 },
    { x: 7.5, y: 18, z: 0.3, r: 4.5 }
  ]
}

const controls: HUDSystemProps = {
  clusters: [
    {
      label: "reload",
      buttons: [[
        { text: "r" }
      ]]
    },
    {
      label: "move",
      buttons: [
        [
          { text: "A", hori: -50, vert: 0 },
          { text: "S", hori: 0, vert: 0 },
          { text: "D", hori: 50, vert: 0 }
        ], [
          { text: "W", hori: 0, vert: 50 },
        ]
      ]
    },
    {
      label: "jump",
      buttons: [[
        { text: "spacebar", hori: 10, vert: 10 }
      ]]
    }
  ]
}
