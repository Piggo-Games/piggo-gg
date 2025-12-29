import { Entity, Html, HText, Position } from "@piggo-gg/core"
import type { MarsState } from "./Mars"

const months = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
]

export const DateDisplay = (): Entity => {
  let dateText: HTMLDivElement | undefined
  let lastMonth = -1
  let lastYear = -1

  return Entity({
    id: "marsDateDisplay",
    components: {
      position: Position(),
      html: Html({
        init: (world) => {
          const { month, year } = world.state<MarsState>()
          const monthName = months[month] ?? "???"

          lastMonth = month
          lastYear = year

          dateText = HText({
            text: `${monthName} ${year}`,
            style: {
              left: "16px",
              top: "54px",
              marginTop: "env(safe-area-inset-top)",
              marginLeft: "env(safe-area-inset-left)",
              // backgroundColor: "rgba(0, 0, 0, 0.35)",
              // border: "1px solid rgba(255, 255, 255, 0.35)",
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

          const { month, year } = world.state<MarsState>()
          if (month === lastMonth && year === lastYear) return

          lastMonth = month
          lastYear = year

          const monthName = months[month] ?? "???"
          dateText.textContent = `${monthName} ${year}`
        }
      })
    }
  })
}
