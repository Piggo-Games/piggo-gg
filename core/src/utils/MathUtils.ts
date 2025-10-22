import { Entity, Position, World } from "@piggo-gg/core"
import { Vector3 } from "three"
import { Container } from "pixi.js"

export type Capsule = { A: XYZ, B: XYZ, radius: number }
export type XY = { x: number, y: number }
export type XZ = { x: number, z: number }
export type XYZ = { x: number, y: number, z: number }
export type XYZR = { x: number, y: number, z: number, r: number }
export type XYZstring = `${number},${number},${number}`
export type Bounds = { left: number, right: number, top: number, bottom: number }
export type TwoPoints = [number, number, number, number]
export type Oct = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7
export type OctString = "u" | "ur" | "r" | "dr" | "d" | "dl" | "l" | "ul"

export const { abs, floor, ceil, hypot, max, min, pow, random, sign, sqrt, sin, cos, PI } = Math

export const minmax = (n: number, minValue: number, maxValue: number) => {
  return min(max(n, minValue), maxValue)
}

export const round = (n: number, places = 0) => {
  const factor = pow(10, places)
  return Math.round((n + Number.EPSILON) * factor) / factor
}

export const randomInt = (n: number, s: number = 0) => {
  return round(random() * n - s)
}

export const randomLR = (scale = 1) => {
  return (random() - 0.5) * scale
}

// reduces toward zero
export const reduce = (n: number, by: number): number => {
  if (n > 0) return max(0, n - by)
  if (n < 0) return min(0, n + by)
  return 0
}

export const { isArray } = Array

export const arrayEqual = <T>(a: T[], b: T[]): boolean => {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      return false
    }
  }
  return true
}

export const randomChoice = <T>(xs: T[]): T => {
  return xs[floor(random() * xs.length)]
}

export const XY = (vec: Vector3): XY => {
  return { x: vec.x, y: vec.y }
}

export const XZ = (xyz: XYZ): XZ => {
  return { x: xyz.x, z: xyz.z }
}

export const XYZ = (vec: Vector3): XYZ => {
  return { x: vec.x, y: vec.z, z: vec.y }
}

export const XYdistance = (a: XY, b: XY): number => {
  return hypot(a.x - b.x, a.y - b.y)
}

export const XYZdistance = (a: XYZ, b: XYZ): number => {
  return hypot(a.x - b.x, a.y - b.y, a.z - b.z)
}

export const XYZadd = (a: XYZ, b: XYZ): XYZ => {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z }
}

export const XYZscale = (a: XYZ, scale: number): XYZ => {
  return { x: a.x * scale, y: a.y * scale, z: a.z * scale }
}

export const XYZsub = (a: XYZ, b: XYZ): XYZ => {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z }
}

export const XYZdot = (a: XYZ, b: XYZ): number => {
  return a.x * b.x + a.y * b.y + a.z * b.z
}

export const XYdiff = (a: XY, b: XY, threshold: number = 0) => {
  const distance = XYdistance(a, b)
  return distance > threshold
}

export const XYZdiff = (a: XYZ, b: XYZ, threshold: number = 0) => {
  const distance = XYZdistance(a, b)
  return distance > threshold
}

export const XYequal = (a: XY, b: XY) => {
  return a.x === b.x && a.y === b.y
}

export const XYZequal = (a: XYZ, b: XYZ) => {
  return a.x === b.x && a.y === b.y && a.z === b.z
}

export const XYZnormal = (xyz: XYZ) => {
  const total = abs(xyz.x) + abs(xyz.y) + abs(xyz.z)

  return {
    x: xyz.x / total, y: xyz.y / total, z: xyz.z / total
  }
}

export const upAndDir = (world: World): { up: XYZ, dir: XZ } => {
  const camera = world.three?.camera
  if (!camera) return { up: { x: 0, y: 0, z: 0 }, dir: { x: 0, z: 0 } }

  const up = { x: round(camera.c.up.x, 3), y: round(camera.c.up.y, 3), z: round(camera.c.up.z, 3) }
  const dir = XZ(camera.dir(world))
  return { up, dir }
}

export const middle = (a: XY, b: XY): XY => {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
}

export const timeToLand = (g: number, z: number, v: number): number => {
  const a = -0.5 * g
  const discriminant = v * v - 4 * a * z
  return (-v - sqrt(discriminant)) / (2 * a)
}

export const velocityToPoint = (from: XYZ, to: XY, g: number, v: number): XY => {
  const t = timeToLand(g, from.z, v) || 1

  const x = (to.x - from.x) / t
  const y = (to.y - from.y) / t

  return { x, y }
}

// returns velocity to reach a point at a certain distance toward the "to" point
export const velocityToDirection = (from: XYZ, to: XY, distance: number, g: number, v: number): XY => {
  const t = timeToLand(g, from.z, v)

  const dx = to.x - from.x
  const dy = to.y - from.y
  const totalDistance = sqrt(dx * dx + dy * dy)

  if (totalDistance === 0) return { x: 0, y: 0 }

  const scale = min(distance / totalDistance, 1)
  const targetX = dx * scale
  const targetY = dy * scale

  const x = targetX / t
  const y = targetY / t

  return { x, y }
}

export const toOctString = (o: Oct): OctString => {
  const directions: OctString[] = ["l", "ul", "u", "ur", "r", "dr", "d", "dl"]
  return directions[o] || "d"
}

export const setsEqual = <T>(xs: Set<T>, ys: Set<T>) => {
  return xs.size === ys.size && [...xs].every((x) => ys.has(x))
}

export const addPoints = (arr1: [number, number] | number[], arr2: [number, number]): [number, number] => {
  return [arr1[0] + arr2[0], arr1[1] + arr2[1]]
}

export const worldToIsometric = ({ x, y }: XY): XY => ({
  x: x - y,
  y: (x + y) / 2
})

export const isometricToWorld = ({ x, y }: XY): XY => ({
  x: (2 * y + x) / 2,
  y: (2 * y - x) / 2
})

export const angleCC = (x: number, y: number) => {
  return (Math.atan2(y, x) * 180) / PI + 180
}

export const pointsIsometric = (points: number[][]) => points.map(([x, y]) => worldToIsometric({ x, y })).map(({ x, y }) => [x, y]).flat()

export const colorAdd = (color: number, add: number): number => {
  const r = min(255, ((color >> 16) & 0xff) + ((add >> 16) & 0xff))
  const g = min(255, ((color >> 8) & 0xff) + ((add >> 8) & 0xff))
  const b = min(255, (color & 0xff) + (add & 0xff))

  return (r << 16) + (g << 8) + b
}

export const positionDelta = (a: Position, b: Position): number => {
  return hypot(a.data.x - b.data.x, a.data.y - b.data.y)
}

export const closestEntity = (pos: XY, entities: Entity<Position>[], maxDistance?: number): Entity<Position> | undefined => {
  if (entities.length > 1) {
    entities.sort((a: Entity<Position>, b: Entity<Position>) => {
      const aPosition = a.components.position
      const bPosition = b.components.position
      const dx = aPosition.data.x - pos.x
      const dy = aPosition.data.y - pos.y
      const da = dx * dx + dy * dy
      const dx2 = bPosition.data.x - pos.x
      const dy2 = bPosition.data.y - pos.y
      const db = dx2 * dx2 + dy2 * dy2
      return da - db
    })
  }
  if (maxDistance) {
    entities = entities.filter((e) => positionDelta(e.components.position, Position(pos)) < maxDistance)
  }
  return entities[0]
}

export const normalize = ({ x, y, entity }: { x: number, y: number, entity: Entity<Position> }): XY => {
  const { speed } = entity.components.position.data

  if (x === 0) return { x, y: sign(y) * speed }
  if (y === 0) return { x: sign(x) * speed, y }

  const ratio = x * x / (y * y)

  const newX = sqrt(speed * speed / (1 + ratio)) * sign(x)
  const newY = sqrt(speed * speed / (1 + 1 / ratio)) * sign(y)

  return { x: newX, y: newY }
}

export const vectorExtend = (vec: XYZ, amount: number): XYZ => {
  const len = hypot(vec.x, vec.y, vec.z)
  if (len === 0) return vec

  const newLen = len + amount

  return {
    x: (vec.x / len) * newLen,
    y: (vec.y / len) * newLen,
    z: (vec.z / len) * newLen
  }
}

export const rayCapsuleIntersect = (from: XYZ, dir: XYZ, capsule: Capsule): false | { sc: number, tc: number } => {
  const { A, B, radius } = capsule

  const u = dir // ray direction
  const v = XYZsub(B, A) // segment direction
  const w = XYZsub(from, A) // origin to A

  const a = XYZdot(u, u) // always >= 0
  const b = XYZdot(u, v)
  const c = XYZdot(v, v) // segment length^2
  const d = XYZdot(u, w)
  const e = XYZdot(v, w)

  const EPS = 1e-8

  // Degenerate capsule -> sphere at A (or very short segment)
  if (c < EPS) {
    console.error("degenerate capsule")
    // return raySphereIntersect(from, dir, A, radius)
  }

  const D = a * c - b * b     // denominator for the unconstrained solution

  // Numerators and denominators for sc (ray param) and tc (segment param)
  let sN: number, sD: number = D
  let tN: number, tD: number = D

  // Default (unconstrained) solution
  if (D > EPS) {
    sN = (b * e - c * d)
    tN = (a * e - b * d)

    // Enforce ray constraint s >= 0
    if (sN < 0) {              // closest is behind origin; clamp s=0
      sN = 0
      tN = e
      tD = c
    }
  } else {
    // Ray and segment are almost parallel
    sN = 0
    sD = 1
    tN = e
    tD = c
  }

  // Clamp t to [0,1]
  if (tN < 0) {
    tN = 0
    // Recompute s for t=0 (closest to endpoint A)
    sN = -d
    sD = a
    if (sN < 0) sN = 0 // still must be in front of the ray
  } else if (tN > tD) {
    tN = tD
    // Recompute s for t=1 (closest to endpoint B)
    sN = b - d
    sD = a
    if (sN < 0) sN = 0
  }

  // Final params
  const sc = (Math.abs(sN) < EPS ? 0 : sN / sD) // ray parameter  (>= 0)
  const tc = (Math.abs(tN) < EPS ? 0 : tN / tD) // segment param  (in [0,1])

  // Vector between closest points: w + sc*u - tc*v
  const closestVec = XYZsub(
    XYZadd(w, XYZscale(u, sc)),
    XYZscale(v, tc)
  )

  const dist2 = XYZdot(closestVec, closestVec)

  const result = dist2 <= radius * radius

  return result ? { sc, tc } : false
}

// Minimal robust ray-sphere fallback used above
export const raySphereIntersect = (from: XYZ, dir: XYZ, C: XYZ, r: number) => {
  const m = XYZsub(from, C)
  const b = XYZdot(m, dir)
  const c = XYZdot(m, m) - r * r

  if (c > 0 && b > 0) return false

  const discr = b * b - XYZdot(dir, dir) * c
  return discr >= 0
}

// DEPRECATED

export const tileIndex = (n: number, tileMap: number[]): number => {
  let numZeros = 0
  for (let i = 0; i < n; i++) {
    if (tileMap[i] === 0) numZeros++
  }
  return n - numZeros
}

export const searchVisibleTiles = (start: XY, floorTilesArray: Entity, tileMap: number[]): Set<Container> => {
  const visibleTilesContainers: Set<Container> = new Set()

  const directions: (XY & { plus?: number })[] = [
    { x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 0, y: -1 },
    { x: 0.1, y: 0.9 },
    { x: 0.2, y: 0.8 },
    { x: 0.3, y: 0.7, plus: 1 },
    { x: 0.4, y: 0.6, plus: 1 },
    { x: 0.45, y: 0.55, plus: 1 },
    { x: 0.5, y: 0.5, plus: 2 },
    { x: 0.55, y: 0.45, plus: 1 },
    { x: 0.6, y: 0.4, plus: 1 },
    { x: 0.7, y: 0.3, plus: 1 },
    { x: 0.8, y: 0.2 },
    { x: 0.9, y: 0.1 },
    { x: -0.1, y: 0.9 },
    { x: -0.2, y: 0.8 },
    { x: -0.3, y: 0.7, plus: 1 },
    { x: -0.4, y: 0.6, plus: 1 },
    { x: -0.45, y: 0.55, plus: 1 },
    { x: -0.5, y: 0.5, plus: 2 },
    { x: -0.55, y: 0.45, plus: 1 },
    { x: -0.6, y: 0.4, plus: 1 },
    { x: -0.7, y: 0.3, plus: 1 },
    { x: -0.8, y: 0.2 },
    { x: -0.9, y: 0.1 },
    { x: 0.1, y: -0.9 },
    { x: 0.2, y: -0.8 },
    { x: 0.3, y: -0.7, plus: 1 },
    { x: 0.4, y: -0.6, plus: 1 },
    { x: 0.45, y: -0.55, plus: 1 },
    { x: 0.5, y: -0.5, plus: 2 },
    { x: 0.55, y: -0.45, plus: 1 },
    { x: 0.6, y: -0.4, plus: 1 },
    { x: 0.7, y: -0.3, plus: 1 },
    { x: 0.8, y: -0.2 },
    { x: 0.9, y: -0.1 },
    { x: -0.1, y: -0.9 },
    { x: -0.2, y: -0.8 },
    { x: -0.3, y: -0.7, plus: 1 },
    { x: -0.4, y: -0.6, plus: 1 },
    { x: -0.45, y: -0.55, plus: 1 },
    { x: -0.5, y: -0.5, plus: 2 },
    { x: -0.55, y: -0.45, plus: 1 },
    { x: -0.6, y: -0.4, plus: 1 },
    { x: -0.7, y: -0.3, plus: 1 },
    { x: -0.8, y: -0.2 },
    { x: -0.9, y: -0.1 }
  ]

  const castRay = (direction: XY, maxDistance: number): void => {
    for (let i = 0; i < maxDistance; i++) {
      const x = round(start.x + direction.x * i)
      const y = round(start.y + direction.y * i)

      if (tileMap[x + (y * 80)] === 0) break

      const index = tileIndex(x + (y * 80), tileMap)
      const tile = floorTilesArray.components.renderable?.c.children[index]
      if (!tile) continue
      visibleTilesContainers.add(tile)
    }
  }

  directions.forEach(({ x, y, plus = 0 }) => {
    castRay({ x, y }, 15 + plus)
  })

  return visibleTilesContainers
}
