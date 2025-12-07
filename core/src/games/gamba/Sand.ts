import { Entity, loadTexture, pixiGraphics, Position, Renderable, XY } from "@piggo-gg/core"
import { MaskFilter, Sprite } from "pixi.js"

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
        setup: async (r, renderer) => {
          const texture = await loadTexture("sand.json")

          // for (let i = 0; i < 8; i++) {
          //   const copy = new Sprite(texture["0"])
          //   copy.anchor.set(0.5, 0.5)
          //   copy.x = -200 + i * 44


          //   r.c.addChild(copy)
          // }

          const mask = pixiGraphics()
          // mask.circle(0, 0, 50).fill({ color: 0xffff00 })
          // const maskSprite = new Sprite(renderer.app.renderer.generateTexture({ mask }))
          // r.c.addChild(maskSprite)

          // const filter = new MaskFilter({ sprite: maskSprite, inverse: true })
          // r.c.filters = [filter]

          const maskPoints = [
            -halfW + offset, -halfH,
            halfW - offset, -halfH,
            halfW, halfH,
            -halfW, halfH,
            -halfW + offset, -halfH
          ]

          for (let i = 0; i < maskPoints.length; i += 2) {
            mask.lineTo(maskPoints[i], maskPoints[i + 1])
          }
          mask.stroke({ width: 1, color: 0xffff00, alpha: 1 }).fill({ color: 0xffff00 })

          r.c.addChild(mask)

          r.c.mask = mask

          // r.c.addChild(mask)

          // const maskSprite = new Sprite(mask

          // r.c.mask = mask


          for (let i = 0; i < 14; i++) {
            const copy = new Sprite(texture["0"])
            copy.anchor.set(0.5, 0.5)
            copy.x = -260 + i * 44


            r.c.addChild(copy)
          }



          // r.c.addChild(s)

          // r.c = new Sprite(texture["0"])
        }
      })
    }
  })

  return sand
}
