import { Component, XYZ } from "@piggo-gg/core"

export type HitboxShape = {
  type: "box"
  width: number
  height: number
  depth: number
  offset: XYZ
}

export type Hitbox = Component<"hitbox"> & {
  shapes: HitboxShape[]
}

export const Hitbox = (shapes: HitboxShape[]): Hitbox => ({
  type: "hitbox",
  shapes: shapes.map(shape => ({
    ...shape,
    offset: { ...shape.offset }
  }))
})
