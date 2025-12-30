import { Entity, Html, HText, Position } from "@piggo-gg/core"
import type { MarsState } from "../Mars"

const months = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
]

export const DateDisplay = (): Entity => {
  let dateText: HTMLDivElement | undefined
  let lastDay = -1
  let lastMonth = -1
  let lastYear = -1

  return Entity({
    id: "marsDateDisplay",
    components: {
      position: Position(),
      html: Html({
        init: (world) => {
          const { day, month, year } = world.state<MarsState>()
          const monthName = months[month] ?? "???"

          lastDay = day
          lastMonth = month
          lastYear = year

          dateText = HText({
            text: `${monthName} ${day}, ${year}`,
            style: {
              left: "16px",
              top: "54px",
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

          const { day, month, year } = world.state<MarsState>()
          if (day === lastDay && month === lastMonth && year === lastYear) return

          lastDay = day
          lastMonth = month
          lastYear = year

          const monthName = months[month]
          dateText.textContent = `${monthName} ${day}, ${year}`
        }
      })
    }
  })
}
