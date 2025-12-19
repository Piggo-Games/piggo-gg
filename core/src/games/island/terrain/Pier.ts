import { Entity, load, Position, Renderable } from "@piggo-gg/core"
import { Sprite } from "pixi.js"

export const Pier = (): Entity => {

  const pier = Entity({
    id: `pier`,
    components: {
      position: Position({
        y: 97, x: -140
      }),
      renderable: Renderable({
        zIndex: 2,
        scale: 3,
        setup: async (r) => {
          const t = await load("pier.png")

          r.c = new Sprite(t)
        }
      })
    }
  })
  return pier
}
