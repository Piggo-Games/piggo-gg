import { Entity, pixiRect, Position, Renderable } from "@piggo-gg/core"
import { Assets, DisplacementFilter, Geometry, Sprite, TilingSprite } from "pixi.js"

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

  let dFilter: DisplacementFilter | undefined = undefined

  const water2D = Entity({
    id: `water2D`,
    components: {
      position: Position(),
      renderable: Renderable({
        anchor: { x: 0, y: 0 },
        zIndex: 0,
        scaleMode: "nearest",
        onTick: () => {
          // dFilter!.groups
        },
        setup: async (r) => {

          const area = pixiRect({ x: -1000, y: -60, w: 2000, h: 2000, style: { strokeAlpha: 0.2, strokeWidth: 1 } })
            .fill({ color: 0x111138, alpha: 1 })

          const dMap = await Assets.load("displacement_map.png")

          dFilter = new DisplacementFilter({ sprite: new Sprite(dMap) })
          // r.c.filters = [dFilter]
          console.log("dFilter", dFilter)



          const stars = Sprite.from(await Assets.load("night.png")).texture
          const tiled = new TilingSprite({
            texture: stars, width: 2000, height: 2000, alpha: 0.3,
            position: { x: -1000, y: -60 },
            tilePosition: { x: 207, y: 0 }
          })

          r.c.addChild(area, tiled)
        }
      })
    }
  })

  return water2D
}
