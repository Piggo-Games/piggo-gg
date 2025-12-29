import { abs, Entity, Html, HText, Position, round } from "@piggo-gg/core"
import type { MarsState } from "./Mars"

export const MoneyDisplay = (): Entity => {
  let moneyText: HTMLDivElement | undefined
  let lastMoney: number | undefined
  let resetTimer: ReturnType<typeof setTimeout> | undefined

  const formatMoney = (value: number) => {
    const rounded = round(value)
    const total = abs(rounded).toLocaleString("en-US")
    return rounded < 0 ? `-$${total}` : `$${total}`
  }

  const pulse = (direction: "up" | "down") => {
    if (!moneyText) return

    if (resetTimer) clearTimeout(resetTimer)

    const offset = direction === "up" ? -12 : 12
    moneyText.style.transform = `translate(0, ${offset}px)`

    resetTimer = setTimeout(() => {
      if (moneyText) moneyText.style.transform = "translate(0, 0)"
    }, 140)
  }

  return Entity({
    id: "marsMoneyDisplay",
    components: {
      position: Position(),
      html: Html({
        init: () => {
          moneyText = HText({
            text: "$0",
            style: {
              left: "16px",
              top: "16px",
              marginTop: "env(safe-area-inset-top)",
              marginLeft: "env(safe-area-inset-left)",
              // backgroundColor: "rgba(0, 0, 0, 0.45)",
              // border: "2px solid rgba(255, 255, 255, 0.35)",
              padding: "6px",
              paddingLeft: "12px",
              paddingRight: "12px",
              display: "inline-flex",
              alignItems: "center",
              fontSize: "26px",
              whiteSpace: "nowrap",
              transform: "translate(0%, 0%)",
              transition: "transform 0.12s ease, color 0.2s ease"
            }
          })

          return moneyText
        },
        onTick: (world) => {
          if (!moneyText) return

          const { money } = world.state<MarsState>()
          if (lastMoney === money) return

          const previous = lastMoney
          lastMoney = money

          const nextText = formatMoney(money)
          if (moneyText.textContent !== nextText) {
            moneyText.textContent = nextText
          }

          moneyText.style.color = money < 0 ? "#ff6b6b" : "#6dff6d"

          if (previous !== undefined && money !== previous) {
            pulse(money > previous ? "up" : "down")
          }
        }
      })
    }
  })
}
