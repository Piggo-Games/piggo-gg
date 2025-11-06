import {
  Background, Cursor, Entity, EscapeMenu, GameBuilder, HUDSystem, HUDSystemProps, HtmlChat,
  HtmlLagText, NametagSystem, PhysicsSystem, PixiCameraSystem, PixiRenderSystem, Position,
  Renderable, ScorePanel, ScorePanelHtml, ShadowSystem, SpawnSystem, SystemBuilder, Team, screenWH, values
} from "@piggo-gg/core"
import { Bot } from "./Bot"
import { Ball, Bounds, Centerline, Court, Net, PostBottom, PostTop } from "./entities"
import { TargetSystem } from "./Target"
import { Vince } from "./Vince"

export const range = 32

export type VolleyState = {
  hit: 0 | 1 | 2 | 3 | 4
  jumpHits: string[]
  lastHit: string
  lastHitTeam: 0 | 1 | 2
  lastHitTick: number
  lastWin: 0 | 1 | 2
  lastWinTick: number
  phase: "serve" | "play" | "point" | "game"
  scoreLeft: number
  scoreRight: number
  teamServing: 1 | 2
}

export const Volley: GameBuilder<VolleyState> = {
  id: "volley",
  init: (world) => ({
    id: "volley",
    netcode: "rollback",
    renderer: "pixi",
    settings: {},
    state: {
      hit: 0,
      jumpHits: [],
      lastHit: "",
      lastHitTeam: 0,
      lastHitTick: 0,
      lastWin: 0,
      lastWinTick: 0,
      phase: "point",
      scoreLeft: 0,
      scoreRight: 0,
      teamServing: 1
    },
    systems: [
      PhysicsSystem("local"),
      PhysicsSystem("global"),
      SpawnSystem(Vince),
      VolleySystem,
      ShadowSystem,
      TargetSystem,
      PixiRenderSystem,
      NametagSystem,
      HUDSystem(controls),
      PixiCameraSystem(() => ({ x: 225, y: 0, z: 0 }))
    ],
    entities: [
      Background({ rays: true }),

      Cursor(),
      Ball(),
      Court(),
      Centerline(),
      PostTop(),
      PostBottom(),
      Net(),
      Bounds("2"),
      Bounds("3"),

      // ScorePanel(),
      ScorePanelHtml(),
      HtmlChat(),
      EscapeMenu(world),
      HtmlLagText()
    ]
  })
}

const VolleySystem = SystemBuilder({
  id: "VolleySystem",
  init: (world) => {
    const bots: Record<string, Entity<Position | Team>> = {}

    // spawn bots
    const players = world.queryEntities<Team>(["pc", "team"])
    if (players.length < 4) {

      let team1 = 0
      let team2 = 0

      for (const player of players) {
        if (player.components.team.data.team === 1) team1++
        if (player.components.team.data.team === 2) team2++
      }

      while (team1 < 2) {
        const bot = Bot(1, { x: 100, y: -30 + 30 * team1 })
        bots[bot.id] = bot
        team1++
      }

      while (team2 < 2) {
        const bot = Bot(2, { x: 350, y: -30 + 30 * team2 })
        bots[bot.id] = bot
        team2++
      }

      for (const bot of values(bots)) world.addEntity(bot)
    }

    // scale the camera
    if (world.client) {
      const desiredScale = screenWH().w / 600 - 0.2
      world.pixi?.camera.scaleTo(desiredScale)
    }

    return {
      id: "VolleySystem",
      query: [],
      priority: 9,
      onTick: () => {
        const ballPos = world.entity<Position>("ball")?.components.position
        if (!ballPos) return

        const state = world.game.state as VolleyState
        const playerCharacters = world.queryEntities<Position | Team | Renderable>(["position", "team", "input"])
        const characters = world.queryEntities<Position | Team | Renderable>(["position", "team", "actions"])

        // reset jump hits
        const newJumpHits = []
        if (state.jumpHits && state.jumpHits.length > 0) {
          for (const jumpHitter of state.jumpHits) {
            const character = world.entity<Position | Team | Renderable>(jumpHitter)
            if (character && !character.components.position.data.standing) {
              newJumpHits.push(character.id)
            }
          }
        }
        state.jumpHits = newJumpHits

        if (state.phase === "point") {

          // wait for ball to land
          if (ballPos.data.z > 0) return

          // set score
          if (state.lastWin === 1) state.scoreLeft++
          if (state.lastWin === 2) state.scoreRight++
          state.teamServing = state.lastWin === 2 ? 2 : 1

          if (state.scoreLeft >= 7 || state.scoreRight >= 7) {
            state.scoreLeft = 0
            state.scoreRight = 0
          }

          // reset state
          state.phase = "serve"
          state.lastHit = ""
          state.lastHitTeam = 0
          state.hit = 0

          // reset ball
          ballPos.setVelocity({ x: 0, y: 0, z: 0 }).setRotation(0).setGravity(0)
          ballPos.setPosition({
            x: state.teamServing === 1 ? 10 : 400,
            y: 1, z: 50
          })
        }

        if (state.phase === "serve" && state.hit === 0) {
          let team1 = 0
          let team2 = 0

          for (const playerCharacter of playerCharacters) {
            const { position, team } = playerCharacter.components

            // move any characters if they're on the wrong side
            if (position.data.x < 225 && team.data.team === 2) {
              position.setPosition({ x: 300, y: position.data.y, z: position.data.z })
            } else if (position.data.x > 225 && team.data.team === 1) {
              position.setPosition({ x: 150, y: position.data.y, z: position.data.z })
            }

            if (team.data.team === 1) { team1++ } else { team2++ }
          }

          // adjust bots
          for (const bot of values(bots)) {
            const { team } = bot.components
            if (team.data.team === 1) {
              if (team1 >= 2) {
                world.removeEntity(bot.id)
                delete bots[bot.id]
              } else {
                team1++
              }
            } else {
              if (team2 >= 2) {
                world.removeEntity(bot.id)
                delete bots[bot.id]
              } else {
                team2++
              }
            }
          }

          // spawn new bots
          while (team1 < 2) {
            team1++
            const bot = Bot(1, { x: 100, y: -30 + 30 * team1 })
            bots[bot.id] = bot
            world.addEntity(bot)
          }

          while (team2 < 2) {
            team2++
            const bot = Bot(2, { x: 350, y: -30 + 30 * team2 })
            bots[bot.id] = bot
            world.addEntity(bot)
          }
        }

        if (state.phase === "play" || state.phase === "serve") {
          if (ballPos.data.z === 0) {
            state.phase = "point"
            state.lastWin = (ballPos.data.x < 225) ? 2 : 1
            state.lastWinTick = world.tick
          }

          for (const character of characters) {
            const { renderable } = character.components
            if (character.id === state.lastHit && state.phase === "play") {
              renderable.setGlow({ color: 0xffffff, outerStrength: 3 })
            } else {
              renderable.setGlow()
            }
          }
        }
      }
    }
  }
})

const controls: HUDSystemProps = {
  direction: "row",
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
    },
    {
      label: "hit",
      buttons: [["mb1"]]
    },
    {
      label: "switch team",
      buttons: [["t"]]
    }
  ]
}
