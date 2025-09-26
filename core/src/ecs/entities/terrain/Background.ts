import { Collider, Entity, Position, Renderable } from "@piggo-gg/core"
import { Assets, Sprite, Texture, TilingSprite } from "pixi.js"
import { GodrayFilter } from "pixi-filters"

export type BackgroundProps = {
  img?: string
  json?: { path: string, img: string }
  rays?: boolean
  moving?: boolean
  follow?: boolean
}

export const Background = ({ img, json, rays, moving, follow }: BackgroundProps = {}) => Entity({
  id: "background",
  components: {
    position: Position(),
    renderable: Renderable({
      zIndex: -2,
      interpolate: true,
      onRender: ({ renderable, delta, world }) => {
        if (moving) {
          const tile = renderable.c as TilingSprite
          tile.tilePosition.x = (world.tick + delta / 25) * 0.5
        }
      },
      onTick: ({ renderable, world, entity }) => {
        const godRayFilter = renderable.filters["rays"] as GodrayFilter
        if (rays && godRayFilter) godRayFilter.time += 0.008

        // const tile = renderable.c as TilingSprite
        // if (moving) tile.tilePosition.x += 0.5

        const { position } = entity.components

        if (follow) {
          const { focus } = world.pixi?.camera ?? {}
          if (focus && world.pixi) {

            const { x, y, z, velocity } = focus.components.position.data

            // tile.tilePosition.x = 0.85 * x
            // tile.tilePosition.y = 0.85 * y

            position.setVelocity({
              x: velocity.x * 0.85,
              y: velocity.y * 0.85,
              z: velocity.z
            })

            position.data.stop = focus.components.position.data.stop
            position.setPosition({ z })

            position.lastCollided = focus.components.position.lastCollided
            position.localVelocity = { ...position.data.velocity }
              // x: focus.components.position.localVelocity.x * 0.85,
              // y: focus.components.position.localVelocity.y * 0.85,
              // z: velocity.z
          }
        }
      },
      setup: async (renderable) => {
        let texture: Texture

        if (json) {
          const assets = await Assets.load(json.path)
          texture = assets.textures[json.img]
        } else {
          texture = Sprite.from(await Assets.load(img ?? "night.png")).texture
        }

        renderable.c = new TilingSprite({
          texture: texture,
          tilePosition: { x: 207, y: 117 },
          width: 6000,
          height: 6000
        })

        if (rays) renderable.setRays({ gain: 0.45, alpha: 0.45, lacunarity: 2 })
        renderable.setBloom({ threshold: 0.5, bloomScale: 0.95 })
      }
    })
  }
})
