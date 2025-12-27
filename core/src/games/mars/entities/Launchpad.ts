import { Entity, pixiGraphics, Position, Renderable } from "@piggo-gg/core"

export const Launchpad = (): Entity => {
  return Entity({
    id: "launchpad",
    components: {
      position: Position({ x: 0, y: 140 }),
      renderable: Renderable({
        zIndex: 3,
        scale: 0.3,
        setup: async (r) => {
          const g = pixiGraphics()

          g.moveTo(-100, -50)
            .lineTo(100, -50)
            .lineTo(130, 50)
            .lineTo(-130, 50)
            .lineTo(-100, -50)
            .fill({ color: 0x555555 })

          r.c = g
        }
      })
    }
  })
}
