import { Collider, Debug, Entity, loadTexture, pixiAnimation, Position, Renderable, Shadow } from "@piggo-gg/core"

export const Patrick = (): Entity => {

  const patrick = Entity({
    id: "patrick",
    components: {
      position: Position({ x: 140 }),
      debug: Debug(),
      collider: Collider({
        shape: "ball", radius: 10, isStatic: true, group: "2"
      }),
      shadow: Shadow(9, 0, 1),
      renderable: Renderable({
        anchor: { x: 0.5, y: 0.9 },
        scale: 1.8,
        zIndex: 4,
        interpolate: true,
        scaleMode: "nearest",
        animationSelect: () => "idle",
        setup: async (r) => {
          const t = await loadTexture("StarGuy.json")

          r.animations = {
            idle: pixiAnimation(
              [1, 2, 3, 4, 5, 6, 7, 8].map(i => t[`idle${i}`])
            )
          }

          // r.setOverlay({ color: 0xffffaa, alpha: 10 })

          r.c.eventMode = "dynamic"

          r.c.onmouseenter = () => {
            r.setOverlay({ color: 0xffffaa, alpha: 0.5 })
            // hovering = true
            console.log("hover")
          }
        }
      })
    }
  })

  return patrick
}
