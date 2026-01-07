import {
  Action, Actions, Character, Collider, Debug, Entity, Input, Networked, PixiSkins,
  Player, Point, Position, Renderable, Shadow, Team, VolleyCharacterAnimations,
  VolleyCharacterDynamic, WASDInputMap, XY, PI, cos, hypot, max, min, sin
} from "@piggo-gg/core"
import {
  COURT_WIDTH, HOOP_TARGET, PASS_GRAVITY, PASS_SPEED, PASS_UP,
  SHOT_GRAVITY, SHOT_MISS_OFFSET_MAX, SHOT_MISS_OFFSET_MIN,
  SHOT_UP_MAX, SHOT_UP_MIN, SHOT_UP_SCALE
} from "./HoopsConstants"
import { type HoopsState } from "./Hoops"
import { isThreePointShot } from "./HoopsEntities"
import { getShotChance } from "./HoopsShot"

export const HOWARD_SPEED = 135
export const HOWARD_ACCEL = 80

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
        joystick: ({ client }) => {
          const { power, angle } = client.controls.left
          const dir: XY = { x: cos(angle), y: sin(angle) }

          return { actionId: "moveAnalog", params: { dir, power, angle } }
        },
        press: {
          ...WASDInputMap.press,
          "mb1": ({ hold }) => {
            if (hold) return
            return { actionId: "shoot" }
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
        moveAnalog: moveHowardAnalog,
        point: Point,
        pass: passBall,
        shoot: shootBall,
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
})

type AnalogParams = {
  dir: XY
  power: number
  angle: number
}

const moveHowardAnalog = Action<AnalogParams>("moveAnalog", ({ entity, world, params }) => {
  if (!entity) return

  const { position } = entity.components
  if (!position) return

  const state = world.game.state as HoopsState
  if (isMovementLocked(state, entity.id, position)) return

  const power = params.power ?? 0
  if (power <= 0) return

  const dir = params.dir ?? { x: 0, y: 0 }
  const magnitude = hypot(dir.x, dir.y)
  if (!magnitude) return

  const norm = { x: dir.x / magnitude, y: dir.y / magnitude }

  if (norm.x > 0) position.data.facing = 1
  if (norm.x < 0) position.data.facing = -1

  position.clearHeading()

  const accel = (position.data.z > 0 ? HOWARD_ACCEL * 0.16 : HOWARD_ACCEL) * power
  position.impulse({
    x: norm.x * accel,
    y: norm.y * accel
  })
})

const passBall = Action<PassParams>("pass", ({ entity, world, params }) => {
  if (!entity || !params?.target) return

  const state = world.game.state as HoopsState
  if (state.phase !== "play") return
  if (state.ballOwner !== entity.id) return

  const ball = world.entity<Position>("ball")
  const ballPos = ball?.components.position
  if (!ballPos) return

  state.shotTick = world.tick
  state.shotPlayer = entity.id
  state.lastShotValue = 2
  state.ballOwner = ""
  state.ballOwnerTeam = 0
  state.dribbleLocked = false

  ballPos.data.follows = null
  ballPos.setPosition({ z: Math.max(1, ballPos.data.z) })
  ballPos.setGravity(PASS_GRAVITY)

  const dx = params.target.x - ballPos.data.x
  const dy = params.target.y - ballPos.data.y
  if (!Number.isFinite(dx) || !Number.isFinite(dy)) return

  const magnitude = hypot(dx, dy)
  if (!magnitude) return

  ballPos.setVelocity({
    x: (dx / magnitude) * PASS_SPEED,
    y: (dy / magnitude) * PASS_SPEED,
    z: PASS_UP
  })
})

const shootBall = Action("shoot", ({ entity, world }) => {
  if (!entity) return

  const state = world.game.state as HoopsState
  if (state.phase !== "play") return
  if (state.ballOwner !== entity.id) return

  const ball = world.entity<Position>("ball")
  const ballPos = ball?.components.position
  if (!ballPos) return

  state.shotTick = world.tick
  state.shotPlayer = entity.id

  const shooterPos = entity.components.position?.data
  if (shooterPos) {
    state.lastShotValue = isThreePointShot(shooterPos) ? 3 : 2
  } else {
    state.lastShotValue = 2
  }

  const isMake = world.random.next() * 100 <= state.shotChance
  const missAngle = world.random.next() * PI * 2
  const missRadius = SHOT_MISS_OFFSET_MIN + world.random.next() * (SHOT_MISS_OFFSET_MAX - SHOT_MISS_OFFSET_MIN)
  const target = isMake ? HOOP_TARGET : {
    x: HOOP_TARGET.x + cos(missAngle) * missRadius,
    y: HOOP_TARGET.y + sin(missAngle) * missRadius,
    z: HOOP_TARGET.z
  }

  console.log(`Shot by ${entity.id}: ${isMake ? "MAKE" : "MISS"} (${state.shotChance.toFixed(1)}% chance)`)

  const dx = target.x - ballPos.data.x
  const dy = target.y - ballPos.data.y
  if (!Number.isFinite(dx) || !Number.isFinite(dy)) return

  const distance = hypot(dx, dy)
  const distanceCharge = min(1, distance / SHOT_UP_SCALE)
  let up = SHOT_UP_MIN + (SHOT_UP_MAX - SHOT_UP_MIN) * distanceCharge
  const originZ = max(1.5, ballPos.data.z)

  if (target.z > originZ) {
    const minUp = Math.sqrt(2 * SHOT_GRAVITY * (target.z - originZ)) - 0.5 * SHOT_GRAVITY
    if (minUp > up) up = minUp
  }

  const a = -0.5 * SHOT_GRAVITY
  const b = up + 0.5 * SHOT_GRAVITY
  const c = originZ - target.z
  const discriminant = b * b - 4 * a * c
  if (discriminant <= 0) return

  const sqrt = Math.sqrt(discriminant)
  const t1 = (-b - sqrt) / (2 * a)
  const t2 = (-b + sqrt) / (2 * a)
  const ticksToHoop = max(t1, t2)
  if (!Number.isFinite(ticksToHoop) || ticksToHoop <= 0) return

  const timeSeconds = ticksToHoop * (world.tickrate / 1000)
  if (!Number.isFinite(timeSeconds) || timeSeconds <= 0) return

  const velX = dx / timeSeconds
  const velY = dy / timeSeconds

  state.ballOwner = ""
  state.ballOwnerTeam = 0
  state.dribbleLocked = false

  ballPos.data.follows = null
  ballPos.setPosition({ z: originZ })
  ballPos.setGravity(SHOT_GRAVITY)

  ballPos.setVelocity({ x: velX, y: velY, z: up })
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
