import { Entity, load, Position, Renderable, Shadow } from "@piggo-gg/core"
import { Sprite } from "pixi.js"

export const Rail = (): Entity => {
  return Entity({
    id: "rail",
    components: {
      position: Position({ x: -20, y: 140 }),
      shadow: Shadow(2, -1, 4),
      renderable: Renderable({
        zIndex: 4,
        setup: async (r) => {

          const rail = await load("rail.png")
          rail.source.scaleMode = "nearest"
          const railSprite = new Sprite({ texture: rail, scale: 2 })
          railSprite.anchor.set(0, 1)

          r.c.addChild(railSprite)
        }
      })
    }
  })
}
