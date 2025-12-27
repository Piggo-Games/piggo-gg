import { Entity, load, Position, Renderable, Shadow } from "@piggo-gg/core"
import { Sprite } from "pixi.js"

export const Rocket = (): Entity => {
  return Entity({
    id: "rocket",
    components: {
      position: Position({ x: 0, y: 0 }),
      shadow: Shadow(4.5, 139, 0),
      renderable: Renderable({
        zIndex: 5,
        scale: 0.3,
        setup: async (r) => {
          const f9 = await load("f9.png")

          r.c = new Sprite(f9)
        }
      })
    }
  })
}
