import { Entity, loadTexture, pixiGraphics, Position, Renderable } from "@piggo-gg/core"
import { Sprite } from "pixi.js"

export const Sand = () => {

  const arenaWidth = 520
  const arenaHeight = 210
  const halfW = arenaWidth / 2
  const halfH = arenaHeight / 2

  const offset = 60

  const sand = Entity({
    id: `sand`,
    components: {
      position: Position(),
      renderable: Renderable({
        zIndex: 3,
        setup: async (r) => {
          const texture = await loadTexture("sand.json")

          const maskPoints = [
            -halfW + offset, -halfH,
            halfW - offset, -halfH,
            halfW, halfH,
            -halfW, halfH,
            -halfW + offset, -halfH
          ]

          const mask = pixiGraphics()
          for (let i = 0; i < maskPoints.length; i += 2) {
            mask.lineTo(maskPoints[i], maskPoints[i + 1])
          }
          mask.stroke({ width: 1, color: 0xffff00, alpha: 1 }).fill({ color: 0xffff00 })

          r.c.addChild(mask)
          r.c.mask = mask

          for (let j = 0; j < 6; j++) {
            for (let i = 0; i < 14; i++) {
              const copy = new Sprite(texture["0"])
              copy.anchor.set(0.5, 0.5)
              copy.x = -260 + i * 44
              copy.y = -100 + j * 44

              r.c.addChild(copy)
            }
          }
        }
      })
    }
  })

  return sand
}
