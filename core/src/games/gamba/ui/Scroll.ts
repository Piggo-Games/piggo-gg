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

          r.c.eventMode = "dynamic"

          r.c.onmouseenter = () => {
            r.setOverlay({ color: 0xffffaa, alpha: 0.5 })
            console.log("hovered scroll")
          }
          r.c.onmouseleave = () => {
            // r.setOverlay(null)
          }
        }
      })
    }
  })
  return scroll
}
