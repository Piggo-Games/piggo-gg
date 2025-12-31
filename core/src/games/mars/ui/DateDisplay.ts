import { Entity, Html, HText, Position } from "@piggo-gg/core"
import type { MarsState } from "../Mars"

export const DateDisplay = (): Entity => {
  let dateText: HTMLDivElement | undefined
  let lastDate = { day: 1, month: "January", year: 2025 }

  return Entity({
    id: "marsDateDisplay",
    components: {
      position: Position(),
      html: Html({
        init: (world) => {
          const { date } = world.state<MarsState>()

          dateText = HText({
            text: `${date.day} ${date.month} ${date.year}`,
            style: {
              right: "2px",
              top: "8px",
              marginTop: "env(safe-area-inset-top)",
              marginLeft: "env(safe-area-inset-left)",
              padding: "6px",
              paddingLeft: "12px",
              paddingRight: "12px",
              display: "inline-flex",
              alignItems: "center",
              fontSize: "18px",
              whiteSpace: "nowrap"
            }
          })

          return dateText
        },
        onTick: (world) => {
          if (!dateText) return

          const { date } = world.state<MarsState>()

          if (date.day === lastDate.day && date.month === lastDate.month && date.year === lastDate.year) return

          lastDate = { ...date }

          dateText.textContent = `${date.day} ${date.month} ${date.year}`
        }
      })
    }
  })
}
