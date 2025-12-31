import { abs, Entity, Html, HButton, HDiv, HText, Position, round } from "@piggo-gg/core"
import type { MarsState } from "../Mars"

export const MoneyDisplay = (): Entity => {
  let moneyButton: HTMLButtonElement | undefined
  let infoPanel: HTMLDivElement | undefined
  let farLinkValue: HTMLDivElement | undefined
  let contractValue: HTMLDivElement | undefined
  let rocketSpendValue: HTMLDivElement | undefined
  let lastMoney: number | undefined
  let lastFarLinkIncome: number | undefined
  let lastContractRevenue: number | undefined
  let lastRocketSpend: number | undefined
  let infoOpen = false
  let resetTimer: ReturnType<typeof setTimeout> | undefined

  const formatMoney = (value: number) => {
    const rounded = round(value)
    const total = abs(rounded).toLocaleString("en-US")
    return rounded < 0 ? `-$${total}` : `$${total}`
  }

  const pulse = (direction: "up" | "down") => {
    if (!moneyButton) return

    if (resetTimer) clearTimeout(resetTimer)

    const offset = direction === "up" ? -12 : 12
    moneyButton.style.transform = `translate(0, ${offset}px)`

    resetTimer = setTimeout(() => {
      if (moneyButton) moneyButton.style.transform = "translate(0, 0)"
    }, 140)
  }

  return Entity({
    id: "marsMoneyDisplay",
    components: {
      position: Position(),
      html: Html({
        init: (world) => {
          const state = world.state<MarsState>()

          lastMoney = state.money
          lastFarLinkIncome = state.farLinkIncome
          lastContractRevenue = state.contractRevenue
          lastRocketSpend = state.rocketComponentSpend

          moneyButton = HButton({
            text: formatMoney(state.money),
            style: {
              left: "2px",
              top: "4px",
              marginTop: "env(safe-area-inset-top)",
              marginLeft: "env(safe-area-inset-left)",
              padding: "6px",
              paddingLeft: "12px",
              paddingRight: "12px",
              display: "inline-flex",
              alignItems: "center",
              fontSize: "26px",
              whiteSpace: "nowrap",
              background: "none",
              // backgroundColor: "transparent",
              backgroundImage: "none",
              border: "none",
              borderRadius: "0px",
              textShadow: "2px 2px 1px rgba(0, 0, 0, 0.5)",
              transform: "translate(0%, 0%)",
              transition: "transform 0.12s ease, color 0.2s ease, box-shadow 0.2s ease",
              cursor: "pointer"
            },
            onClick: () => {
              infoOpen = !infoOpen
              if (infoPanel) {
                infoPanel.style.display = infoOpen ? "flex" : "none"
              }
              if (moneyButton) {
                moneyButton.style.boxShadow = infoOpen ? "0 0 10px 2px rgba(255, 255, 255, 0.35)" : "none"
              }
            }
          })
          moneyButton.style.color = state.money < 0 ? "#ff6b6b" : "#6dff6d"

          const createInfoRow = (label: string) => {
            const labelText = HText({
              text: label,
              style: {
                position: "relative",
                fontSize: "16px",
                fontWeight: "bold",
                opacity: "0.8"
              }
            })

            const valueText = HText({
              text: "$0",
              style: {
                position: "relative",
                fontSize: "14px",
                fontWeight: "bold",
                textAlign: "right"
              }
            })

            const row = HDiv({
              style: {
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px",
                width: "100%"
              }
            }, labelText, valueText)

            return { row, valueText }
          }

          const header = HText({
            text: "Finances",
            style: {
              position: "relative",
              fontSize: "13px",
              // letterSpacing: "0.12em",
              // textTransform: "uppercase",
              opacity: "0.7",
              marginBottom: "4px"
            }
          })

          const farLinkRow = createInfoRow("FarLink $/day")
          const contractRow = createInfoRow("contract earnings")
          const rocketRow = createInfoRow("rocket spend")

          farLinkValue = farLinkRow.valueText
          contractValue = contractRow.valueText
          rocketSpendValue = rocketRow.valueText

          if (farLinkValue) farLinkValue.textContent = formatMoney(state.farLinkIncome)
          if (contractValue) contractValue.textContent = formatMoney(state.contractRevenue)
          if (rocketSpendValue) rocketSpendValue.textContent = formatMoney(state.rocketComponentSpend)

          infoPanel = HDiv({
            style: {
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)",
              position: "absolute",
              marginTop: "env(safe-area-inset-top)",
              marginLeft: "env(safe-area-inset-left)",
              minWidth: "220px",
              display: "none",
              flexDirection: "column",
              gap: "6px",
              background: "rgba(0, 0, 0, 0.55)",
              border: "1px solid rgba(255, 255, 255, 0.25)",
              borderRadius: "10px",
            }
          }, header, farLinkRow.row, contractRow.row, rocketRow.row)

          const wrapper = HDiv({
            style: {
              left: "0px",
              top: "0px",
              width: "100%",
              height: "100%",
              pointerEvents: "auto"
            }
          }, moneyButton, infoPanel)

          return wrapper
        },
        onTick: (world) => {
          if (!moneyButton) return

          const { money, farLinkIncome, contractRevenue, rocketComponentSpend } = world.state<MarsState>()

          const previous = lastMoney
          const moneyChanged = lastMoney !== money
          if (moneyChanged) lastMoney = money

          if (moneyChanged) {
            const nextText = formatMoney(money)
            if (moneyButton.textContent !== nextText) {
              moneyButton.textContent = nextText
            }

            moneyButton.style.color = money < 0 ? "#ff6b6b" : "#6dff6d"

            if (previous !== undefined && money !== previous) {
              pulse(money > previous ? "up" : "down")
            }
          }

          if (farLinkValue && lastFarLinkIncome !== farLinkIncome) {
            lastFarLinkIncome = farLinkIncome
            farLinkValue.textContent = formatMoney(farLinkIncome)
          }

          if (contractValue && lastContractRevenue !== contractRevenue) {
            lastContractRevenue = contractRevenue
            contractValue.textContent = formatMoney(contractRevenue)
          }

          if (rocketSpendValue && lastRocketSpend !== rocketComponentSpend) {
            lastRocketSpend = rocketComponentSpend
            rocketSpendValue.textContent = formatMoney(rocketComponentSpend)
          }
        }
      })
    }
  })
}
