import {
  Action, Actions, Character, Collider, Debug, Input, Networked, PixiSkins,
  Player, Point, Position, Renderable, Shadow, Team, VolleyCharacterAnimations,
  VolleyCharacterDynamic, WASDInputMap, XY, hypot, max, min, velocityToPoint
} from "@piggo-gg/core"
import {
  COURT_WIDTH, DASH_ACTIVE_TICKS, DASH_COOLDOWN_TICKS, DASH_SPEED, PASS_GRAVITY,
  PASS_UP, SHOT_CHARGE_TICKS, SHOT_GRAVITY, SHOT_SPEED_MAX, SHOT_SPEED_MIN,
  SHOT_UP_MAX, SHOT_UP_MIN
} from "./HoopsConstants"
import type { HoopsState } from "./Hoops"
import {
  addShotCharging, getDashUntil, isShotCharging, removeShotCharging, setDashEntry
} from "./HoopsStateUtils"

export const HOWARD_SPEED = 135
export const HOWARD_ACCEL = 60

export const Howard = (player: Player) => {
  const seed = player.id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0)
  const yOffset = (seed % 3 - 1) * 14
  const spawnX = player.components.team.data.team === 1 ? 80 : COURT_WIDTH - 80

  return Character({
    id: `howard-${player.id}`,
    components: {
      debug: Debug(),
      position: Position({
        x: spawnX, y: yOffset, speed: HOWARD_SPEED, gravity: 0.4, friction: true
      }),
      networked: Networked(),
      collider: Collider({ shape: "ball", radius: 4, group: "notme1" }),
      team: Team(player.components.team.data.team),
      shadow: Shadow(5, 1),
      input: Input({
        release: {
          "mb1": ({ hold }) => {
            return { actionId: "shoot", params: { hold } }
          }
        },
        press: {
          ...WASDInputMap.press,
          "mb1": ({ hold }) => {
            if (hold) return
            return { actionId: "startShotCharge" }
          },
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
        move: moveHoward,
        point: Point,
        pass: passBall,
        shoot: shootBall,
        startShotCharge,
        dash,
        jump: jumpHoward
      }),
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

type PassParams = {
  target: XY
}

type ShootParams = {
  hold?: number
}

const isMovementLocked = (state: HoopsState, entityId: string, position: Position): boolean => {
  return state.ballOwner === entityId
    && state.dribbleLocked
    && position.data.standing
    && position.data.velocity.z <= 0
}

const moveHoward = Action<XY>("move", ({ entity, world, params }) => {
  if (!entity) return

  const { position } = entity.components
  if (!position) return

  const state = world.game.state as HoopsState
  if (isMovementLocked(state, entity.id, position)) return
  if (state.ballOwner === entity.id && isShotCharging(state.shotCharging, entity.id)) {
    position.setVelocity({ x: 0, y: 0 })
    return
  }

  if (!Number.isFinite(params.x) || !Number.isFinite(params.y)) return

  if (params.x > 0) position.data.facing = 1
  if (params.x < 0) position.data.facing = -1

  position.clearHeading()

  const magnitude = hypot(params.x, params.y)
  if (!magnitude) return

  const accel = position.data.z > 0 ? HOWARD_ACCEL * 0.16 : HOWARD_ACCEL

  position.impulse({
    x: (params.x / magnitude) * accel,
    y: (params.y / magnitude) * accel
  })

  // const speed = hypot(position.data.velocity.x, position.data.velocity.y)
  // if (speed > position.data.speed) {
  //   const scale = position.data.speed / speed
  //   position.setVelocity({
  //     x: position.data.velocity.x * scale,
  //     y: position.data.velocity.y * scale
  //   })
  // }
})

const passBall = Action<PassParams>("pass", ({ entity, world, params }) => {
  if (!entity || !params?.target) return

  const state = world.game.state as HoopsState
  if (state.phase !== "play") return
  if (state.ballOwner !== entity.id) return

  const ball = world.entity<Position>("ball")
  const ballPos = ball?.components.position
  if (!ballPos) return

  state.ballOwner = ""
  state.ballOwnerTeam = 0
  state.dribbleLocked = false

  ballPos.data.follows = null
  ballPos.setPosition({ z: Math.max(1, ballPos.data.z) })
  ballPos.setGravity(PASS_GRAVITY)

  const v = velocityToPoint(ballPos.data, params.target, PASS_GRAVITY, PASS_UP)
  const scale = 1000 / world.tickrate

  ballPos.setVelocity({ x: v.x * scale, y: v.y * scale, z: PASS_UP })
})

const startShotCharge = Action("startShotCharge", ({ entity, world }) => {
  if (!entity) return

  const state = world.game.state as HoopsState
  if (state.phase !== "play") return
  if (state.ballOwner !== entity.id) return

  const { position } = entity.components
  if (position) position.setVelocity({ x: 0, y: 0 })

  state.shotCharging = addShotCharging(state.shotCharging, entity.id)
})

const shootBall = Action<ShootParams>("shoot", ({ entity, world, params }) => {
  if (!entity) return

  const state = world.game.state as HoopsState
  state.shotCharging = removeShotCharging(state.shotCharging, entity.id)
  if (state.phase !== "play") return
  if (state.ballOwner !== entity.id) return

  const ball = world.entity<Position>("ball")
  const ballPos = ball?.components.position
  if (!ballPos) return

  const { position } = entity.components
  if (!position) return

  const { pointingDelta } = position.data
  if (!Number.isFinite(pointingDelta.x) || !Number.isFinite(pointingDelta.y)) return

  const magnitude = hypot(pointingDelta.x, pointingDelta.y)
  if (!magnitude) return

  const dirX = pointingDelta.x / magnitude
  const dirY = pointingDelta.y / magnitude

  const hold = max(0, params?.hold ?? 0)
  const charge = min(1, hold / SHOT_CHARGE_TICKS)
  const speed = SHOT_SPEED_MIN + (SHOT_SPEED_MAX - SHOT_SPEED_MIN) * charge
  const up = SHOT_UP_MIN + (SHOT_UP_MAX - SHOT_UP_MIN) * charge
  console.log("Shooting with speed:", speed, charge)

  state.ballOwner = ""
  state.ballOwnerTeam = 0
  state.dribbleLocked = false

  ballPos.data.follows = null
  ballPos.setPosition({ z: Math.max(1.5, ballPos.data.z) })
  ballPos.setGravity(SHOT_GRAVITY)

  ballPos.setVelocity({ x: dirX * speed, y: dirY * speed, z: up })
})

const jumpHoward = Action("jump", ({ entity, world }) => {
  if (!entity) return

  const { position } = entity.components
  if (!position) return
  if (!position.data.standing) return

  const state = world.game.state as HoopsState
  if (isMovementLocked(state, entity.id, position)) return

  position.setVelocity({ z: 5 })

  if (state.ballOwner === entity.id) {
    state.dribbleLocked = true
  }
})

const dash = Action("dash", ({ entity, world }) => {
  if (!entity) return

  const state = world.game.state as HoopsState
  const { position } = entity.components
  if (!position) return

  if (isMovementLocked(state, entity.id, position)) return
  if (state.ballOwner === entity.id && isShotCharging(state.shotCharging, entity.id)) return

  const readyAt = getDashUntil(state.dashReady, entity.id) ?? 0
  if (world.tick < readyAt) return

  state.dashReady = setDashEntry(state.dashReady, entity.id, world.tick + DASH_COOLDOWN_TICKS)
  state.dashActive = setDashEntry(state.dashActive, entity.id, world.tick + DASH_ACTIVE_TICKS)

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
