import { Entity, load, Position, Renderable } from "@piggo-gg/core"
import { Sprite } from "pixi.js"

export const Scroll = (): Entity => {

  const scroll = Entity({
    id: `scroll`,
    components: {
      position: Position({
        y: 90, x: 0
      }),
      renderable: Renderable({
        zIndex: 2,
        scale: 2,
        setup: async (r) => {
          const t = await load("scroll.png")

          r.c = new Sprite(t)
        }
      })
    }
  })
  return scroll
}
