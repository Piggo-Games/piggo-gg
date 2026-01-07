import { Entity, Position, Team, XY, abs, hypot, max, min, round } from "@piggo-gg/core"
import {
  HOOP_TARGET, SHOT_AIM_SCALE, SHOT_BASE_CHANCE, SHOT_BLOCKER_PENALTY,
  SHOT_BLOCKER_RANGE, SHOT_DISTANCE_BONUS, SHOT_DISTANCE_MAX,
  SHOT_DISTANCE_PENALTY, SHOT_JUMP_PENALTY
} from "./HoopsConstants"

export type Factor = { name: string, effect: number }

type ShotContext = {
  ballPos: XY
  shooter: Entity<Position | Team>
  players: Entity<Position | Team>[]
  hoopTarget?: XY
}

const clampPercent = (value: number) => min(100, max(1, value))

const addFactor = (factors: Factor[], name: string, effect: number) => {
  if (effect === 0) return
  factors.push({ name, effect: round(effect, 1) })
}

export const getShotFactors = ({ ballPos, shooter, players, hoopTarget = HOOP_TARGET }: ShotContext): Factor[] => {
  const factors: Factor[] = []

  const { position, team } = shooter.components
  if (!position || !team) return factors

  const { pointingDelta, velocity, standing } = position.data

  const dx = hoopTarget.x - ballPos.x
  const dy = hoopTarget.y - ballPos.y
  const distance = hypot(dx, dy)

  if (distance > 0) {
    const distanceRatio = min(1, distance / SHOT_DISTANCE_MAX)
    const distanceEffect = SHOT_DISTANCE_PENALTY * (distanceRatio * distanceRatio)
    addFactor(factors, "distance", distanceEffect)
    // console.log("distance effect", distanceEffect)

    const aim = pointingDelta
    const aimMagnitude = hypot(aim.x, aim.y)
    if (aimMagnitude > 0) {
      let aimDot = (aim.x / aimMagnitude) * (dx / distance) + (aim.y / aimMagnitude) * (dy / distance)
      if (aimDot < 0) aimDot *= 3
      addFactor(factors, "aim", aimDot * SHOT_AIM_SCALE)
    }
  }

  if (!standing) {
    addFactor(factors, "jump", SHOT_JUMP_PENALTY * abs(velocity.z  / 5))
  }

  let blockerPenalty = 0
  for (const player of players) {
    if (player.id === shooter.id) continue
    if (player.components.team?.data.team === team.data.team) continue

    const defenderPos = player.components.position?.data
    if (!defenderPos) continue

    const dist = hypot(defenderPos.x - position.data.x, defenderPos.y - position.data.y)
    if (dist > SHOT_BLOCKER_RANGE) continue

    const scale = 1 - dist / SHOT_BLOCKER_RANGE
    blockerPenalty += scale * SHOT_BLOCKER_PENALTY
  }
  addFactor(factors, "blockers", blockerPenalty)

  return factors
}

export const getShotChance = (context: ShotContext): { factors: Factor[], total: number } => {
  const factors = getShotFactors(context)
  // console.log(factors.map(f => `${f.name}: ${f.effect}`))
  const total = clampPercent(round(SHOT_BASE_CHANCE + factors.reduce((sum, factor) => sum + factor.effect, 0), 1))
  return { factors, total }
}
