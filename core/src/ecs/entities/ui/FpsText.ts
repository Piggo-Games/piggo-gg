import { Entity, Position, Renderable, pixiText, round } from "@piggo-gg/core"
import { Text } from "pixi.js"

export type FpsTextProps = {
  x?: number
  y?: number
}

export const FpsText = ({ x, y }: FpsTextProps = {}) => Entity<Position | Renderable>({
  id: "fpsText",
  persists: true,
  components: {
    position: Position({ x: x ?? 5, y: y ?? 25, screenFixed: true }),
    renderable: Renderable({
      zIndex: 3,
      setContainer: async () => pixiText({ text: "", style: { fontSize: 16, fill: 0xffffff } }),
      onTick: ({ container, world }) => {
        if (world.tick % 5 !== 0) return

        const t = container as Text
        if (t) {
          const fps = round(world.renderer?.app.ticker.FPS ?? 0)
          // if (t.style) t.style.fill = fps > 100 ? "#00ff00" : fps > 60 ? "yellow" : "red"
          t.text = `fps: ${fps}`
        }
      }
    })
  }
})

export const LagText = ({ x, y }: FpsTextProps = {}) => {

  let last = 0
  let lastTick = 0

  const lagText = Entity<Position | Renderable>({
    id: "lagText",
    components: {
      position: Position({ x: x ?? 5, y: y ?? 30, screenFixed: true }),
      renderable: Renderable({
        zIndex: 3,
        setContainer: async () => pixiText({ text: "", style: { fontSize: 16, fill: 0x00ff00 } }),
        onTick: ({ container, world }) => {
          lagText.components.renderable.visible = world.client?.connected ?? false

          const lag = round(world.client?.ms ?? 0)

          if (lag > last || world.tick - lastTick > 60) {
            last = lag
            lastTick = world.tick

            const t = container as Text
            if (t) {
              // t.style.fill = lag < 50 ? "#00ff00" : lag < 200 ? "yellow" : "red"
              t.text = `ms: ${lag}`
            }
          }
        }
      })
    }
  })
  return lagText
}
