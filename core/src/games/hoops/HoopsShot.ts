import { Entity, Position, Team, XY, hypot, max, min, round } from "@piggo-gg/core"
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

const clampPercent = (value: number) => min(100, max(0, value))

const addFactor = (factors: Factor[], name: string, effect: number) => {
  if (!Number.isFinite(effect) || effect === 0) return
  factors.push({ name, effect: round(effect, 1) })
}

export const getShotFactors = ({ ballPos, shooter, players, hoopTarget = HOOP_TARGET }: ShotContext): Factor[] => {
  const factors: Factor[] = []
  const shooterPos = shooter.components.position?.data
  const shooterTeam = shooter.components.team?.data.team
  if (!shooterPos || !shooterTeam) return factors

  const dx = hoopTarget.x - ballPos.x
  const dy = hoopTarget.y - ballPos.y
  const distance = hypot(dx, dy)

  if (Number.isFinite(distance) && distance > 0) {
    const distanceRatio = min(1, distance / SHOT_DISTANCE_MAX)
    const distanceEffect = SHOT_DISTANCE_BONUS + (SHOT_DISTANCE_PENALTY - SHOT_DISTANCE_BONUS) * distanceRatio
    addFactor(factors, "distance", distanceEffect)

    const aim = shooterPos.pointingDelta
    const aimMagnitude = hypot(aim.x, aim.y)
    if (Number.isFinite(aimMagnitude) && aimMagnitude > 0) {
      const aimDot = (aim.x / aimMagnitude) * (dx / distance) + (aim.y / aimMagnitude) * (dy / distance)
      addFactor(factors, "aim", aimDot * SHOT_AIM_SCALE)
    }
  }

  if (shooterPos.z > 0.1) {
    addFactor(factors, "jump", SHOT_JUMP_PENALTY)
  }

  let blockerPenalty = 0
  for (const player of players) {
    if (player.id === shooter.id) continue
    if (player.components.team?.data.team === shooterTeam) continue

    const defenderPos = player.components.position?.data
    if (!defenderPos) continue

    const dist = hypot(defenderPos.x - shooterPos.x, defenderPos.y - shooterPos.y)
    if (dist > SHOT_BLOCKER_RANGE) continue

    const scale = 1 - dist / SHOT_BLOCKER_RANGE
    blockerPenalty += scale * SHOT_BLOCKER_PENALTY
  }
  addFactor(factors, "blockers", blockerPenalty)

  return factors
}

export const getShotChance = (context: ShotContext): { factors: Factor[], total: number } => {
  const factors = getShotFactors(context)
  const total = clampPercent(round(SHOT_BASE_CHANCE + factors.reduce((sum, factor) => sum + factor.effect, 0), 1))
  return { factors, total }
}
