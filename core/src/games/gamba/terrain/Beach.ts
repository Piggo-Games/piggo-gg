import { Entity, loadTexture, pixiGraphics, Position, Renderable } from "@piggo-gg/core"
import { Sprite } from "pixi.js"

export const Beach = () => {

  const arenaWidth = 500
  const arenaHeight = 100
  const w2 = arenaWidth / 2
  const h2 = arenaHeight / 2

  const offset = 60

  const beach = Entity({
    id: `beach`,
    components: {
      position: Position(),
      renderable: Renderable({
        zIndex: 2,
        setup: async (r) => {
          const texture = await loadTexture("beach.json")

          const maskPoints = [
            -w2 + offset, -h2,
            w2 - offset, -h2,
            w2, h2,
            -w2, h2,
            -w2 + offset, -h2
          ]

          const mask = pixiGraphics().moveTo(maskPoints[0], maskPoints[1])
          for (let i = 2; i < maskPoints.length; i += 2) {
            mask.lineTo(maskPoints[i], maskPoints[i + 1])
          }
          mask.stroke({ width: 1, color: 0xffff00, alpha: 1 }).fill({ color: 0xffff00 })

          r.c.addChild(mask)
          r.c.mask = mask

          for (let j = 0; j < 3; j++) {
            for (let i = 0; i < 13; i++) {
              const copy = new Sprite(texture["0"])
              copy.anchor.set(0.5, 0.5)
              copy.x = -260 + i * 44
              copy.y = -45 + j * 37

              r.c.addChild(copy)
            }
          }
        }
      })
    }
  })

  return beach
}
