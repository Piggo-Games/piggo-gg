import {
  Background, Cursor, EscapeMenu, GameBuilder, HUDSystem, HUDSystemProps,
  HtmlChat, HtmlFpsText, HtmlLagText, PixiNametagSystem, PhysicsSystem,
  PixiCameraSystem, PixiDebugSystem, PixiRenderSystem, Position, Renderable,
  ScorePanel, ShadowSystem, SpawnSystem, SystemBuilder, Team, XY,
  hypot, min, round, screenWH, sign, sqrt, XYdistance
} from "@piggo-gg/core"
import {
  BALL_ORBIT_DISTANCE, BALL_PICKUP_COOLDOWN_TICKS, BALL_PICKUP_RANGE,
  BALL_PICKUP_Z, COURT_CENTER, COURT_HEIGHT, COURT_SPLAY, COURT_WIDTH,
  DRIBBLE_BOUNCE, DRIBBLE_GRAVITY, SCORE_RESET_TICKS, SHOT_CHARGE_Z
} from "./HoopsConstants"
import { Ball, CenterCircle, Centerline, Court, CourtLines, Goal1 } from "./HoopsEntities"
import { Howard } from "./Howard"
import { getShotChance } from "./HoopsShot"
import { MobileUI } from "./MobileUI"

export type HoopsState = {
  phase: "play" | "score"
  scoreLeft: number
  scoreRight: number
  scoredTeam: 0 | 1 | 2
  scoredTick: number
  shotTick: number
  shotPlayer: string
  lastShotValue: 2 | 3
  shotFactors: string[]
  shotChance: number
  ballOwner: string
  ballOwnerTeam: 0 | 1 | 2
  dribbleLocked: boolean
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
      shotTick: 0,
      shotPlayer: "",
      lastShotValue: 2,
      shotFactors: [],
      shotChance: 0,
      ballOwner: "",
      ballOwnerTeam: 0,
      dribbleLocked: false
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
      CourtLines(),
      Goal1(),
      Centerline(),
      CenterCircle(),
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
    const mobileUI = MobileUI(world)
    const halfCourtHeight = COURT_HEIGHT / 2
    const orbitOffset = (pointingDelta: XY) => {
      if (!Number.isFinite(pointingDelta.x) || !Number.isFinite(pointingDelta.y)) {
        return { x: BALL_ORBIT_DISTANCE, y: 0 }
      }

      const hypotenuse = hypot(pointingDelta.x, pointingDelta.y)
      if (!hypotenuse) return { x: BALL_ORBIT_DISTANCE, y: 0 }

      const hypX = pointingDelta.x / hypotenuse
      const hypY = pointingDelta.y / hypotenuse

      return {
        x: round(hypX * BALL_ORBIT_DISTANCE, 2),
        y: round(hypY * (BALL_ORBIT_DISTANCE / 2), 2)
      }
    }

    const isInCourtBounds = (x: number, y: number): boolean => {
      if (!Number.isFinite(x) || !Number.isFinite(y)) return false
      if (y < -halfCourtHeight || y > halfCourtHeight) return false

      const t = (y + halfCourtHeight) / COURT_HEIGHT
      const leftEdge = -COURT_SPLAY * t
      const rightEdge = COURT_WIDTH + COURT_SPLAY * t

      return x >= leftEdge && x <= rightEdge
    }

    const resetBall = () => {
      const ball = world.entity<Position>("ball")
      const ballPos = ball?.components.position
      if (!ballPos) return

      ballPos.setVelocity({ x: 0, y: 0, z: 0 }).setRotation(0).setGravity(0.1)
      ballPos.setPosition({ x: COURT_CENTER.x, y: 0, z: 0 })
      ballPos.data.offset = { x: 0, y: 0 }
    }

    const assignBall = (playerId: string, team: 1 | 2) => {
      const ball = world.entity<Position | Renderable>("ball")
      const ballPos = ball?.components.position
      if (!ballPos) return

      const state = world.game.state as HoopsState
      state.ballOwner = playerId
      state.ballOwnerTeam = team
      state.dribbleLocked = false

      ballPos.setVelocity({ x: 0, y: 0, z: 0 }).setGravity(0).setPosition({ z: 3.6 })

      if (ball?.components.collider) ball.components.collider.setGroup("none")
    }

    let lastBallZ = 0

    return {
      id: "HoopsSystem",
      query: [],
      priority: 9,
      onTick: () => {
        mobileUI?.update()
        const state = world.game.state as HoopsState
        const ball = world.entity<Position | Renderable>("ball")
        const ballPos = ball?.components.position
        if (!ballPos) return

        const players = world.queryEntities<Position | Team>(["position", "team", "input"])

        // reset after score
        if (state.phase === "score" && (world.tick - state.scoredTick) > SCORE_RESET_TICKS) {
          if (state.scoreLeft >= 11 || state.scoreRight >= 11) {
            state.scoreLeft = 0
            state.scoreRight = 0
          }

          state.phase = "play"
          state.scoredTeam = 0
          state.scoredTick = 0
          state.shotTick = 0
          state.shotPlayer = ""
          state.lastShotValue = 2
          state.shotFactors = []
          state.shotChance = 0
          state.ballOwner = ""
          state.ballOwnerTeam = 0
          state.dribbleLocked = false
          // resetBall()
        }

        // remove ownership if owner missing
        if (state.ballOwner && !world.entities[state.ballOwner]) {
          state.ballOwner = ""
          state.ballOwnerTeam = 0
          state.dribbleLocked = false
        }

        if (!state.ballOwner && ballPos.data.z === 0 && !isInCourtBounds(ballPos.data.x, ballPos.data.y)) {
          state.ballOwner = ""
          state.ballOwnerTeam = 0
          state.dribbleLocked = false
          resetBall()
        }

        // ball carry
        if (state.ballOwner) {
          const owner = world.entity<Position | Team>(state.ballOwner)
          const ownerPos = owner?.components.position
          const ownerTeam = owner?.components.team

          if (!ownerPos || !ownerTeam) {
            state.ballOwner = ""
            state.ballOwnerTeam = 0
            state.dribbleLocked = false
          } else {
            state.ballOwnerTeam = ownerTeam.data.team
            const offset = orbitOffset(ownerPos.data.pointingDelta)
            const shouldDribble = !state.dribbleLocked && ownerPos.data.standing
            const carryZ = ownerPos.data.z + SHOT_CHARGE_Z

            ballPos.data.offset = offset

            if (!shouldDribble) {
              ballPos.setGravity(0)
              ballPos.setVelocity({
                x: ownerPos.data.velocity.x,
                y: ownerPos.data.velocity.y
              })
              ballPos.setPosition({
                x: ownerPos.data.x + offset.x,
                y: ownerPos.data.y + offset.y,
                z: carryZ
              })
              ballPos.localVelocity = {
                x: ownerPos.localVelocity.x,
                y: ownerPos.localVelocity.y,
                z: ownerPos.localVelocity.z
              }
            } else {
              ballPos.setGravity(DRIBBLE_GRAVITY + 0.0005 * ownerPos.getSpeed())
              ballPos.setVelocity({
                x: ownerPos.data.velocity.x,
                y: ownerPos.data.velocity.y
              })
              ballPos.setPosition({
                x: ownerPos.data.x + offset.x,
                y: ownerPos.data.y + offset.y
              })

              ballPos.localVelocity = {
                x: ownerPos.localVelocity.x,
                y: ownerPos.localVelocity.y,
                z: ballPos.data.velocity.z
              }
            }

            if (ball?.components.collider) ball.components.collider.setGroup("none")
          }
        } else {
          ballPos.data.offset = { x: 0, y: 0 }

          if (ball?.components.collider) ball.components.collider.setGroup("2")
        }

        if (ballPos.data.z <= 0 && ballPos.data.velocity.z <= -0.01) {
          ballPos.setVelocity({ z: DRIBBLE_BOUNCE })
          world.client?.sound.playChoice(["bounce1", "bounce2", "bounce3", "bounce4"])
        }

        // dash steal
        // if (state.ballOwner) {
        //   for (const player of players) {
        //     const team = player.components.team.data.team
        //     if (team === state.ballOwnerTeam) continue

            // const dashUntil = getDashUntil(state.dashActive, player.id)
            // if (!dashUntil || dashUntil < world.tick) continue

        //     const distance = hypot(
        //       player.components.position.data.x - ballPos.data.x,
        //       player.components.position.data.y - ballPos.data.y
        //     )

        //     if (distance <= BALL_STEAL_RANGE) {
        //       assignBall(player.id, team)
        //       break
        //     }
        //   }
        // }

        // auto pickup
        if (!state.ballOwner && ballPos.data.z <= BALL_PICKUP_Z) {
          let closest: { id: string, team: 1 | 2, distance: number } | null = null
          const shotCooldownActive = !!state.shotPlayer
            && (world.tick - state.shotTick) < BALL_PICKUP_COOLDOWN_TICKS

          for (const player of players) {
            if (shotCooldownActive && player.id === state.shotPlayer) continue

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

        if (state.ballOwner) {
          const owner = world.entity<Position | Team>(state.ballOwner)
          if (owner?.components.position && owner?.components.team) {
            const shotChance = getShotChance({
              ballPos: ballPos.data,
              shooter: owner,
              players
            })
            state.shotFactors = shotChance.factors.map(f => f.name)
            state.shotChance = shotChance.total
            // console.log("shot chance:", state.shotChance)
          } else {
            state.shotFactors = []
            state.shotChance = 0
          }
        } else {
          state.shotFactors = []
          state.shotChance = 0
        }

        // swish sound when the ball drops through the hoop
        if (!state.ballOwner && state.phase !== "score" && ballPos.data.velocity.z < 0 && ballPos.data.z >= 36) {

          const dist = XYdistance(ballPos.data, { x: -26, y: 0 })

          if (dist < 6) {
            console.log("swoosh")
            world.client?.sound.play({ name: "swish" })

            // count the score
            state.phase = "score"
            state.scoredTick = world.tick
            state.scoredTeam = 1
            state.scoreLeft += state.lastShotValue
          }
        }

        lastBallZ = ballPos.data.z

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
      label: "jump",
      buttons: [["spacebar"]]
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
      label: "menu",
      buttons: [["esc"]]
    }
  ]
}
