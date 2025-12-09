import { Entity, pixiRect, Position, Renderable } from "@piggo-gg/core"
import { Assets, BlurFilter, DisplacementFilter, FillGradient, Geometry, Sprite, TilingSprite } from "pixi.js"

export const Water2D = (): Entity => {

  const geometry = new Geometry()

  const positions = new Float32Array([
    -500, 0,
    500, 0,
    500, 500,
    -500, 500
  ])

  geometry.addAttribute("aPosition", positions)
  geometry.addIndex([0, 1, 2, 2, 3, 0])

  let dMap: Sprite | undefined = undefined
  let dFilter: DisplacementFilter | undefined = undefined

  const water2D = Entity({
    id: `water2D`,
    components: {
      position: Position(),
      renderable: Renderable({
        anchor: { x: 0, y: 0 },
        zIndex: 0,
        scaleMode: "nearest",
        onRender: ({ delta, world }) => {
          if (dMap) dMap.x = (world.tick + delta / 25) * 1
          if (dMap) dMap.y = (world.tick + delta / 25) * 0.7
        },
        setup: async (r) => {
          const area = pixiRect({ x: -1000, y: -60, w: 2000, h: 2000, style: { strokeAlpha: 0.2, strokeWidth: 1 } })
            .fill(new FillGradient({
              colorStops: [
                { offset: 0, color: 0x0050cb },
                { offset: 0.07, color: 0x00255d },
                { offset: 0.12, color: 0x000010 },
              ]
            }))

          dMap = new Sprite(await Assets.load("displacement_map.png"))
          dMap.texture.source.addressMode = "repeat"

          const night = Sprite.from(await Assets.load("night.png"))
          const stars = new TilingSprite({
            texture: night.texture, width: 2000, height: 2000, alpha: 0.6,
            position: { x: -1000, y: -60 },
            tilePosition: { x: 207, y: -20 }
          })

          stars.filters = [
            new DisplacementFilter({ sprite: dMap, scale: 30 }),
            new BlurFilter({ strength: 1 })
          ]

          r.c.addChild(dMap, area, stars)
        }
      })
    }
  })

  return water2D
}
