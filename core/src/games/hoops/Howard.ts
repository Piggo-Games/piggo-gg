import {
  Action, Actions, Character, Collider, Debug, Input, Move, Networked,
  PixiSkins, Player, Point, Position, Renderable, Shadow, Team,
  VolleyCharacterAnimations, VolleyCharacterDynamic, WASDInputMap, XY, hypot,
  min, minmax, velocityToPoint
} from "@piggo-gg/core"
import {
  COURT_WIDTH, DASH_ACTIVE_TICKS, DASH_COOLDOWN_TICKS, DASH_SPEED, HOOP_OFFSET_X,
  PASS_GRAVITY, PASS_UP, SHOT_GRAVITY, SHOT_UP_MAX, SHOT_UP_MIN, SHOT_UP_SCALE
} from "./HoopsConstants"
import type { HoopsState } from "./Hoops"
import { getDashUntil, setDashEntry } from "./HoopsStateUtils"

type ThrowParams = {
  target: XY
}

const passBall = Action<ThrowParams>("pass", ({ entity, world, params }) => {
  if (!entity || !params?.target) return

  const state = world.game.state as HoopsState
  if (state.phase !== "play") return
  if (state.ballOwner !== entity.id) return

  const ball = world.entity<Position>("ball")
  const ballPos = ball?.components.position
  if (!ballPos) return

  state.ballOwner = ""
  state.ballOwnerTeam = 0

  ballPos.data.follows = null
  ballPos.setPosition({ z: Math.max(1, ballPos.data.z) })
  ballPos.setGravity(PASS_GRAVITY)

  const v = velocityToPoint(ballPos.data, params.target, PASS_GRAVITY, PASS_UP)
  const scale = 1000 / world.tickrate

  ballPos.setVelocity({ x: v.x * scale, y: v.y * scale, z: PASS_UP })
})

const shootBall = Action<ThrowParams>("shoot", ({ entity, world, params }) => {
  if (!entity) return

  const state = world.game.state as HoopsState
  if (state.phase !== "play") return
  if (state.ballOwner !== entity.id) return

  const ball = world.entity<Position>("ball")
  const ballPos = ball?.components.position
  if (!ballPos) return

  const { position, team } = entity.components
  if (!position || !team) return

  const hoopX = team.data.team === 1 ? COURT_WIDTH - HOOP_OFFSET_X : HOOP_OFFSET_X
  const hoopY = 0

  const distance = hypot(position.data.x - hoopX, position.data.y - hoopY)
  const up = min(SHOT_UP_MAX, SHOT_UP_MIN + distance / SHOT_UP_SCALE)

  const target = params?.target ?? { x: hoopX, y: hoopY }
  const aim = {
    x: hoopX + minmax(target.x - hoopX, -12, 12),
    y: hoopY + minmax(target.y - hoopY, -12, 12)
  }

  state.ballOwner = ""
  state.ballOwnerTeam = 0

  ballPos.data.follows = null
  ballPos.setPosition({ z: Math.max(1.5, ballPos.data.z) })
  ballPos.setGravity(SHOT_GRAVITY)

  const v = velocityToPoint(ballPos.data, aim, SHOT_GRAVITY, up)
  const scale = 1000 / world.tickrate

  ballPos.setVelocity({ x: v.x * scale, y: v.y * scale, z: up })
})

const dash = Action("dash", ({ entity, world }) => {
  if (!entity) return

  const state = world.game.state as HoopsState
  const readyAt = getDashUntil(state.dashReady, entity.id) ?? 0
  if (world.tick < readyAt) return

  state.dashReady = setDashEntry(state.dashReady, entity.id, world.tick + DASH_COOLDOWN_TICKS)
  state.dashActive = setDashEntry(state.dashActive, entity.id, world.tick + DASH_ACTIVE_TICKS)

  const { position } = entity.components
  if (!position) return

  const { pointingDelta, velocity } = position.data

  let dx = velocity.x
  let dy = velocity.y

  if (!dx && !dy) {
    dx = Number.isFinite(pointingDelta.x) ? pointingDelta.x : 0
    dy = Number.isFinite(pointingDelta.y) ? pointingDelta.y : 0
  }

  const magnitude = hypot(dx, dy)
  if (!magnitude) return

  position.impulse({ x: (dx / magnitude) * DASH_SPEED, y: (dy / magnitude) * DASH_SPEED })
})

export const Howard = (player: Player) => {
  const seed = player.id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0)
  const yOffset = (seed % 3 - 1) * 14
  const spawnX = player.components.team.data.team === 1 ? 80 : COURT_WIDTH - 80

  return Character({
    id: `howard-${player.id}`,
    components: {
      debug: Debug(),
      position: Position({
        x: spawnX, y: yOffset,
        velocityResets: 1, speed: 135, gravity: 0.25
      }),
      networked: Networked(),
      collider: Collider({ shape: "ball", radius: 4, group: "notme1" }),
      team: Team(player.components.team.data.team),
      input: Input({
        press: {
          ...WASDInputMap.press,
          "shift": ({ hold }) => {
            if (hold) return
            return { actionId: "dash" }
          },
          " ": ({ hold }) => {
            if (hold) return
            return { actionId: "jump" }
          },
          "g": ({ world, hold }) => {
            if (hold === 5) {
              world.debug = !world.debug
            }
          },
          "mb1": ({ hold, mouse }) => {
            if (hold || !mouse) return
            return { actionId: "shoot", params: { target: mouse } }
          },
          "mb2": ({ hold, mouse }) => {
            if (hold || !mouse) return
            return { actionId: "pass", params: { target: mouse } }
          },
          "t": ({ hold, world }) => {
            if (hold) return
            world.actions.push(world.tick + 2, player.id, { actionId: "SwitchTeam" })
          }
        }
      }),
      actions: Actions({
        move: Move,
        point: Point,
        pass: passBall,
        shoot: shootBall,
        dash,
        jump: Action("jump", ({ entity }) => {
          const { position } = entity?.components ?? {}
          if (!position?.data.standing) return
          position.setVelocity({ z: 5 })
        })
      }),
      shadow: Shadow(5),
      renderable: Renderable({
        anchor: { x: 0.55, y: 0.9 },
        scale: 1.2,
        zIndex: 4,
        interpolate: true,
        scaleMode: "nearest",
        setup: async (r) => {
          await PixiSkins["dude-white"](r)
        },
        animationSelect: VolleyCharacterAnimations,
        onTick: VolleyCharacterDynamic
      })
    }
  })
}
