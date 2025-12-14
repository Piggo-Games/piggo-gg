import { Debug, Entity, Position, Renderable, pixiText, values, load } from "@piggo-gg/core"
import { Sprite } from "pixi.js"

export type ScrollProps = {
  id: string
  title: string
  description: string
  manaCost: number
  position?: { x?: number, y?: number }
}

const wrapText = (text: string, maxChars: number): string => {
  const words = text.split(" ")
  const lines: string[] = []
  let line = ""

  for (const word of words) {
    const next = line ? `${line} ${word}` : word
    if (next.length > maxChars) {
      lines.push(line || word)
      line = line ? word : ""
    } else {
      line = next
    }
  }

  if (line.length) {
    lines.push(line)
  }

  return lines.join("\n")
}

export const Scroll = ({ id, title, description, manaCost, position }: ScrollProps): Entity => {

  let hovering = false
  let overlayActive = false

  const x = position?.x ?? 0
  const y = position?.y ?? 90

  const textColor = 0x3b2c1c

  const scroll = Entity<Renderable>({
    id: `scroll-${id}`,
    components: {
      debug: Debug(),
      position: Position({
        x, y
      }),
      renderable: Renderable({
        zIndex: 2,
        scale: 2.5,
        anchor: { x: 0.53, y: 0.5 },
        scaleMode: "nearest",
        onRender: ({ renderable }) => {
          if (hovering) {
            renderable.setOverlay({ color: 0xffffaa, alpha: 0.3 })
            overlayActive = true
          } else if (overlayActive) {
            delete renderable.filters["overlay"]
            renderable.c.filters = values(renderable.filters)
            overlayActive = false
          }
        },
        setup: async (r) => {
          const t = await load("scroll.png")

          r.c = new Sprite(t)

          r.c.eventMode = "dynamic"

          r.c.onmouseenter = () => {
            hovering = true
          }
          r.c.onmouseleave = () => {
            hovering = false
          }

          const titleText = pixiText({
            text: title,
            pos: { x: 0, y: -14 },
            anchor: { x: 0.5, y: 0 },
            style: { fontSize: 6, fill: textColor, align: "center", resolution: 16 }
          })

          const descriptionText = pixiText({
            text: wrapText(description, 20),
            pos: { x: 0, y: -2 },
            anchor: { x: 0.5, y: 0 },
            style: { fontSize: 2.8, fill: textColor, align: "center", resolution: 16 }
          })

          const manaText = pixiText({
            text: `${manaCost} mana`,
            pos: { x: 0, y: 12 },
            anchor: { x: 0.5, y: 0 },
            style: { fontSize: 3.5, fill: 0x1c64f2, align: "center", resolution: 16 }
          })

          r.c.addChild(titleText, descriptionText, manaText)
        }
      })
    }
  })
  return scroll
}
