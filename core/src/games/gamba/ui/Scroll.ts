import { Debug, Entity, load, Position, Renderable } from "@piggo-gg/core"
import { Sprite } from "pixi.js"

export const Scroll = (): Entity => {

  let hovering = false

  const scroll = Entity<Renderable>({
    id: `scroll`,
    components: {
      debug: Debug(),
      position: Position({
        y: 90, x: 0
      }),
      renderable: Renderable({
        zIndex: 2,
        scale: 2,
        onRender: ({ renderable }) => {
          if (hovering) {
            renderable.setOverlay({ color: 0xffffaa, alpha: 0.3 })
            // scroll.components.position.data.y -= 1?
          }
        },
        setup: async (r) => {
          const t = await load("scroll.png")

          r.c = new Sprite(t)

          r.c.eventMode = "dynamic"

          r.c.onmouseenter = () => {
            // r.setOverlay({ color: 0xffffaa, alpha: 0.5 })
            hovering = true
          }
          r.c.onmouseleave = () => {
            hovering = false
          }
        }
      })
    }
  })
  return scroll
}
