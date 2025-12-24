import { Collider, Debug, Entity, loadTexture, pixiAnimation, Position, Renderable, Shadow } from "@piggo-gg/core"

export const Flag = (): Entity => {

  const flag = Entity({
    id: "flag",
    components: {
      position: Position({ x: 136, y: -36 }),
      debug: Debug(),
      collider: Collider({
        shape: "ball", radius: 2, isStatic: true, group: "2"
      }),
      shadow: Shadow(2, -1.5, 0.5),
      renderable: Renderable({
        anchor: { x: 0.05, y: 1 },
        scale: 1,
        zIndex: 4,
        interpolate: true,
        scaleMode: "nearest",
        animationSelect: () => "idle",
        setup: async (r) => {
          const t = await loadTexture("flag.json")

          r.animations = {
            idle: pixiAnimation(
              [1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => t[`idle${i}`])
            )
          }
        }
      })
    }
  })

  return flag
}
