import { Entity, pixiRect, Position, Renderable } from "@piggo-gg/core"
import { Assets, DisplacementFilter, Geometry, Sprite, Texture, TilingSprite, WRAP_MODES } from "pixi.js"

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

  let tiled: TilingSprite | undefined = undefined

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
          if (dMap) dMap.x += 0.2
          if (dMap) dMap.x += 0.1
          console.log("render water", dMap?.x)
          // if (tiled) tiled.tilePosition.x = (world.tick + delta / 25) * 0.5
        },
        setup: async (r) => {

          const area = pixiRect({ x: -1000, y: -60, w: 2000, h: 2000, style: { strokeAlpha: 0.3, strokeWidth: 1 } })
            .fill({ color: 0x0076cc, alpha: 1 })

          dMap = new Sprite(await Assets.load("displacement_map.png"))
          dMap.texture.baseTexture.wrapMode = "repeat"

          const wave = Sprite.from(await Assets.load("night.png"))
          tiled = new TilingSprite({
            texture: wave.texture, width: 2000, height: 2000, alpha: 0.4,
            position: { x: -1000, y: -60 },
            tilePosition: { x: 207, y: 20 }
          })

          dFilter = new DisplacementFilter({ sprite: dMap, scale: 30 })
          tiled.filters = [dFilter]

          r.c.addChild(dMap, area, tiled)
        }
      })
    }
  })

  return water2D
}
