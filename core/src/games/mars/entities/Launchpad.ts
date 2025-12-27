import { Entity, load, pixiGraphics, Position, Renderable } from "@piggo-gg/core"
import { Sprite } from "pixi.js/lib"

export const Launchpad = (): Entity => {
  return Entity({
    id: "launchpad",
    components: {
      position: Position({ x: 0, y: 140 }),
      renderable: Renderable({
        zIndex: 3,
        setup: async (r) => {
          const g = pixiGraphics()

          const w = 40
          const h = 26

          g.moveTo(-w, -h)
            .lineTo(w, -h)
            .lineTo(w + 30, h)
            .lineTo(-w - 30, h)
            .lineTo(-w, -h)
            .fill({ color: 0x555555 })

          r.c.addChild(g)

          const rail = await load("rail.png")
          rail.source.scaleMode = "nearest"
          const railSprite = new Sprite({ texture: rail, scale: 2 })
          railSprite.anchor.set(0, 1)
          railSprite.position.set(-20, 0)

          r.c.addChild(railSprite)
        }
      })
    }
  })
}
