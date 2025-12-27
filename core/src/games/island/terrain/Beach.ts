import { Entity, LineWall, loadTexture, pixiGraphics, Position, Renderable, XY } from "@piggo-gg/core"
import { Sprite } from "pixi.js"

export type BeachProps = {
  width: number
  height: number
  pos?: XY
}

export const Beach = ({ width, height, pos }: BeachProps) => Entity({
  id: `beach`,
  components: {
    position: Position(pos),
    renderable: Renderable({
      zIndex: 2,
      setup: async (r) => {
        const texture = await loadTexture("beach.json")

        const w2 = width / 2
        const h2 = height / 2
        const offset = 60

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

        const JH = height / 37
        const IW = width / 44
        for (let j = 0; j < JH; j++) {
          for (let i = -IW; i < IW; i++) {
            const copy = new Sprite(texture["0"])
            copy.anchor.set(0.5, 0.5)
            copy.x = -w2 + offset + i * 44
            copy.y = -h2 + j * 37

            r.c.addChild(copy)
          }
        }
      }
    })
  }
})

export const BeachWall = ({ width, height }: BeachProps): Entity => {
  const w2 = width / 2
  const h2 = height / 2
  const offset = 60

  return LineWall({
    id: "beach-wall", points: [
      -w2 + offset, -h2 - 1,
      w2 - offset, -h2 - 1,
      w2, h2 - 3,
      -w2, h2 - 3,
      -w2 + offset, -h2 - 1
    ],
    // fill: 0x0000ff,
    // visible: true,
    group: "1"
  })
}

export const OuterBeachWall = ({ width, height }: BeachProps): Entity => {

  const w = width / 2 + 2
  const h = height / 2 + 2
  const offset = 60

  return LineWall({
    id: "outer-beach-wall", points: [
      -w + offset - 4, -h - 8,
      w - offset + 4, -h - 8,
      w + 12, h,
      -w - 12, h,
      -w + offset - 4, -h - 8
    ],
    // visible: true,
    group: "all"
  })
}
