import {
  Background, Cursor, EscapeMenu, GameBuilder, HUDSystem, HUDSystemProps,
  HtmlChat, HtmlFpsText, HtmlLagText, PixiNametagSystem, PhysicsSystem,
  PixiCameraSystem, PixiDebugSystem, PixiRenderSystem, Position, Renderable,
  ScorePanel, ShadowSystem, SpawnSystem, SystemBuilder, Team, XY,
  abs, hypot, min, round, screenWH, sign, sqrt
} from "@piggo-gg/core"
import {
  BALL_ORBIT_DISTANCE, BALL_PICKUP_RANGE, BALL_PICKUP_Z, BALL_STEAL_RANGE,
  COURT_CENTER, SCORE_RESET_TICKS
} from "./HoopsConstants"
import { Ball, Centerline, Court, HoopSet } from "./HoopsEntities"
import { Howard } from "./Howard"
import { getDashUntil, pruneDashEntries } from "./HoopsStateUtils"

export type HoopsState = {
  phase: "play" | "score"
  scoreLeft: number
  scoreRight: number
  scoredTeam: 0 | 1 | 2
  scoredTick: number
  ballOwner: string
  ballOwnerTeam: 0 | 1 | 2
  dashReady: string[]
  dashActive: string[]
}

export type HoopsSettings = {
  showControls: boolean
}

export const Hoops: GameBuilder<HoopsState, HoopsSettings> = {
  id: "hoops",
  init: (world) => ({
    id: "hoops",
    netcode: "rollback",
    renderer: "pixi",
    settings: {
      showControls: true
    },
    state: {
      phase: "play",
      scoreLeft: 0,
      scoreRight: 0,
      scoredTeam: 0,
      scoredTick: 0,
      ballOwner: "",
      ballOwnerTeam: 0,
      dashReady: [],
      dashActive: []
    },
    systems: [
      PhysicsSystem("local"),
      PhysicsSystem("global"),
      SpawnSystem({ spawner: Howard, pos: { x: COURT_CENTER.x, y: 0, z: 0 } }),
      HoopsSystem,
      ShadowSystem,
      PixiRenderSystem,
      PixiNametagSystem(),
      HUDSystem(controls),
      PixiCameraSystem({
        follow: () => ({ x: COURT_CENTER.x, y: 0, z: 0 }),
        resize: () => {
          const { w } = screenWH()
          return min(3.4, w / (550 * 1.1))
        }
      }),
      PixiDebugSystem
    ],
    entities: [
      Background({ rays: true }),
      Cursor(),
      Ball(),
      Court(),
      Centerline(),
      ...HoopSet(),
      ScorePanel(),
      HtmlChat(),
      EscapeMenu(world),
      HtmlLagText(),
      HtmlFpsText()
    ]
  })
}

const HoopsSystem = SystemBuilder({
  id: "HoopsSystem",
  init: (world) => {
    const orbitOffset = (pointingDelta: XY) => {
      if (!Number.isFinite(pointingDelta.x) || !Number.isFinite(pointingDelta.y)) {
        return { x: BALL_ORBIT_DISTANCE, y: 0 }
      }

      const hypotenuse = hypot(pointingDelta.x, pointingDelta.y)
      if (!hypotenuse) return { x: BALL_ORBIT_DISTANCE, y: 0 }

      const hypX = pointingDelta.x / hypotenuse
      const hypY = pointingDelta.y / hypotenuse

      return {
        x: round(hypX * min(BALL_ORBIT_DISTANCE, abs(pointingDelta.x)), 2),
        y: round(hypY * min(BALL_ORBIT_DISTANCE, abs(pointingDelta.y)) - 2, 2)
      }
    }

    const resetBall = () => {
      const ball = world.entity<Position>("ball")
      const ballPos = ball?.components.position
      if (!ballPos) return

      ballPos.setVelocity({ x: 0, y: 0, z: 0 }).setRotation(0).setGravity(0.1)
      ballPos.setPosition({ x: COURT_CENTER.x, y: 0, z: 0 })
      ballPos.data.follows = null
      ballPos.data.offset = { x: 0, y: 0 }
    }

    const assignBall = (playerId: string, team: 1 | 2) => {
      const ball = world.entity<Position | Renderable>("ball")
      const ballPos = ball?.components.position
      if (!ballPos) return

      const state = world.game.state as HoopsState
      state.ballOwner = playerId
      state.ballOwnerTeam = team

      ballPos.setVelocity({ x: 0, y: 0, z: 0 }).setGravity(0)
      ballPos.data.follows = playerId

      if (ball?.components.collider) ball.components.collider.setGroup("none")
    }

    return {
      id: "HoopsSystem",
      query: [],
      priority: 9,
      onTick: () => {
        const state = world.game.state as HoopsState
        const ball = world.entity<Position | Renderable>("ball")
        const ballPos = ball?.components.position
        if (!ballPos) return

        const players = world.queryEntities<Position | Team | Renderable>(["position", "team", "input"])

        const exists = (id: string) => Boolean(world.entities[id])
        state.dashReady = pruneDashEntries(state.dashReady, world.tick, exists, (until, now) => until > now)
        state.dashActive = pruneDashEntries(state.dashActive, world.tick, exists, (until, now) => until >= now)

        // reset after score
        if (state.phase === "score" && (world.tick - state.scoredTick) > SCORE_RESET_TICKS) {
          if (state.scoreLeft >= 11 || state.scoreRight >= 11) {
            state.scoreLeft = 0
            state.scoreRight = 0
          }

          state.phase = "play"
          state.scoredTeam = 0
          state.scoredTick = 0
          state.ballOwner = ""
          state.ballOwnerTeam = 0
          resetBall()
        }

        // remove ownership if owner missing
        if (state.ballOwner && !world.entities[state.ballOwner]) {
          state.ballOwner = ""
          state.ballOwnerTeam = 0
        }

        // ball carry
        if (state.ballOwner) {
          const owner = world.entity<Position | Team>(state.ballOwner)
          const ownerPos = owner?.components.position
          const ownerTeam = owner?.components.team

          if (!ownerPos || !ownerTeam) {
            state.ballOwner = ""
            state.ballOwnerTeam = 0
          } else {
            state.ballOwnerTeam = ownerTeam.data.team
            ballPos.data.offset = orbitOffset(ownerPos.data.pointingDelta)
            ballPos.data.follows = owner.id
            ballPos.setVelocity({ x: 0, y: 0, z: 0 }).setGravity(0)

            if (ball?.components.collider) ball.components.collider.setGroup("none")
          }
        } else {
          ballPos.data.follows = null
          ballPos.data.offset = { x: 0, y: 0 }

          if (ball?.components.collider) ball.components.collider.setGroup("2")
        }

        // dash steal
        if (state.ballOwner) {
          for (const player of players) {
            const team = player.components.team.data.team
            if (team === state.ballOwnerTeam) continue

            const dashUntil = getDashUntil(state.dashActive, player.id)
            if (!dashUntil || dashUntil < world.tick) continue

            const distance = hypot(
              player.components.position.data.x - ballPos.data.x,
              player.components.position.data.y - ballPos.data.y
            )

            if (distance <= BALL_STEAL_RANGE) {
              assignBall(player.id, team)
              break
            }
          }
        }

        // auto pickup
        if (!state.ballOwner && ballPos.data.z <= BALL_PICKUP_Z) {
          let closest: { id: string, team: 1 | 2, distance: number } | null = null

          for (const player of players) {
            const distance = hypot(
              player.components.position.data.x - ballPos.data.x,
              player.components.position.data.y - ballPos.data.y
            )

            if (distance <= BALL_PICKUP_RANGE && (!closest || distance < closest.distance)) {
              closest = {
                id: player.id,
                team: player.components.team.data.team,
                distance
              }
            }
          }

          if (closest) assignBall(closest.id, closest.team)
        }

        // ball spin
        const { x, y } = ballPos.data.velocity
        ballPos.data.rotation += 0.001 * sqrt((x * x + y * y)) * sign(x || 1)
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
      label: "shoot",
      buttons: [["mb1"]]
    },
    {
      label: "pass",
      buttons: [["mb2"]]
    },
    {
      label: "dash",
      buttons: [["shift"]]
    },
    {
      label: "menu",
      buttons: [["esc"]]
    }
  ]
}
