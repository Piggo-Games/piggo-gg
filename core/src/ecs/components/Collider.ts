import { Component, Entity, Position, World } from "@piggo-gg/core"
import { Collider as RapierCollider, ColliderDesc, RigidBody, RigidBodyDesc } from "@dimforge/rapier2d-compat"

export type ColliderShapes = "ball" | "cuboid" | "line"

export type SensorCallback = (e2: Entity<Position | Collider>, world: World) => boolean

export const ColliderGroups = {
  all:     "11111111111111111111111111111111",
  default: "11111111000000001111111100000000",
  none:    "00000000000000000000000000000000",
  notself: "01000000000000001000000000000000",
  "1":     "00000000000000010000000000000001",
  "2":     "00000000000000100000000000000010",
  "3":     "00000000000001000000000000000100",
  "4":     "00000000000010000000000000001000",
  "5":     "00000000000100000000000000010000",
  "6":     "00000000001000000000000000100000",
  "7":     "00000000010000000000000001000000",
  "8":     "00000000100000000000000010000000",
  "9":     "00000001000000000000000100000000",
  "10":    "00000010000000000000001000000000",
  "11":    "00000100000000000000010000000000",
  "12":    "00001000000000000000100000000000",
  "13":    "00010000000000000001000000000000",
  "14":    "00100000000000000010000000000000",
  "15":    "01000000000000000100000000000000",
  "16":    "10000000000000001000000000000000",
  "17":    "00000000000000110000000000000011",
  "18":    "00000000000001100000000000000110",
  "19":    "00000000000011000000000000001100",
  "20":    "00000000000110000000000000011000",
  "21":    "00000000001100000000000000110000",
  "22":    "00000000011000000000000001100000",
  "23":    "00000000110000000000000011000000",
  "24":    "00000001100000000000000110000000",
  "25":    "00000011000000000000001100000000",
  "26":    "00000110000000000000011000000000",
  "27":    "00001100000000000000110000000000",
  "28":    "00011000000000000011000000000000",
  "29":    "00110000000000000110000000000000",
  "30":    "01100000000000001100000000000000",
  "31":    "11000000000000011000000000000000",
  "32":    "00000000000001110000000000000111"
} as const

export type Collider = Component<"collider"> & {
  body: RigidBody | undefined
  bodyDesc: RigidBodyDesc
  colliderDesc: ColliderDesc
  cullable: boolean
  group: keyof typeof ColliderGroups
  hittable: boolean
  isStatic: boolean
  priority: number
  rapierCollider: RapierCollider | undefined
  sensor: SensorCallback
  type: "collider"
  setGroup: (group: keyof typeof ColliderGroups) => void
}

export type ColliderProps = {
  cullable?: boolean
  frictionAir?: number // TODO deprecated
  group?: keyof typeof ColliderGroups
  hittable?: boolean
  isStatic?: boolean
  length?: number
  mass?: number
  points?: number[]
  priority?: number
  radius?: number
  restitution?: number
  rotation?: number
  sensor?: SensorCallback
  shape: ColliderShapes
  width?: number
}

export const Collider = ({
  cullable, shape, hittable, points, radius, length, width, isStatic,
  frictionAir, mass, restitution, sensor, rotation, priority, group
}: ColliderProps): Collider => {

  let colliderDesc: ColliderDesc

  if (shape === "ball" && radius) {
    colliderDesc = ColliderDesc.ball(radius)
  } else if (shape === "cuboid") {
    colliderDesc = ColliderDesc.cuboid(length ?? 1, width ?? 1)
  } else if (shape === "line" && points) {
    const s = ColliderDesc.polyline(Float32Array.from(points))
    colliderDesc = s
  } else {
    throw new Error(`Invalid collider shape ${shape}`)
  }

  colliderDesc.setFriction(0)

  if (sensor) colliderDesc.setSensor(true)
  if (mass) colliderDesc.setMass(mass)
  if (restitution) colliderDesc.setRestitution(restitution)
  if (rotation) colliderDesc.setRotation(rotation)

  const bodyDesc = isStatic ? RigidBodyDesc.fixed() : RigidBodyDesc.dynamic()
  bodyDesc.setLinearDamping(frictionAir ?? 0)

  const collider: Collider = {
    body: undefined,
    bodyDesc,
    colliderDesc: colliderDesc,
    cullable: cullable ?? false,
    group: group ?? "default",
    hittable: hittable ?? false,
    isStatic: isStatic ?? false,
    priority: priority ?? 0,
    rapierCollider: undefined,
    sensor: sensor ?? (() => false),
    type: "collider",
    setGroup: (group) => {
      const n = Number.parseInt(ColliderGroups[group], 2)
      if (n >= 0 && n <= 4294967295) {
        colliderDesc.setCollisionGroups(n)
        collider.group = group
      }
    }
  }

  collider.setGroup(group ? group : "default")

  return collider
}
