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
              fontSize: "20px",
              whiteSpace: "nowrap",
              background: "none",
              backgroundImage: "none",
              border: "none",
              borderRadius: "8px",
              textShadow: "2px 2px 1px rgba(0, 0, 0, 0.5)",
              transform: "translate(0%, 0%)",
              transition: "transform 0.12s ease, color 0.2s ease, box-shadow 0.2s ease",
            },
            onClick: () => {
              if (world.client!.menu) return

              infoOpen = !infoOpen
              world.client!.busy = infoOpen
            }
          })
          moneyButton.style.color = state.money < 0 ? "#ff6b6b" : "#6dff6d"

          const createInfoRow = (label: string) => {
            const labelText = HText({
              text: label,
              style: {
                position: "relative",
                fontSize: "22px",
                fontWeight: "bold",
                paddingLeft: "6px"
              }
            })

            const valueText = HText({
              text: "$0",
              style: {
                position: "relative",
                fontSize: "20px",
                fontWeight: "bold",
                textAlign: "right",
                paddingRight: "6px"
              }
            })

            const row = HDiv({
              style: {
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                paddingBottom: "6px",
                width: "100%"
              }
            }, labelText, valueText)

            return { row, valueText }
          }

          const header = HText({
            text: "Financials",
            style: {
              position: "relative",
              fontSize: "20px",
              left: "50%",
              width: "max-content",
              transform: "translate(-50%, 0%)",
              paddingTop: "4px",
              marginBottom: "4px",
              opacity: "0.9",
            }
          })

          const contractRow = createInfoRow("total revenue")
          const farLinkRow = createInfoRow("income $/day")
          const rocketRow = createInfoRow("expenses")

          contractValue = contractRow.valueText
          farLinkValue = farLinkRow.valueText
          rocketSpendValue = rocketRow.valueText

          if (contractValue) contractValue.textContent = formatMoney(state.contractRevenue)
          if (farLinkValue) farLinkValue.textContent = formatMoney(state.farLinkIncome)
          if (rocketSpendValue) rocketSpendValue.textContent = formatMoney(state.rocketComponentSpend)

          infoPanel = HDiv({
            style: {
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)",
              position: "absolute",
              marginTop: "env(safe-area-inset-top)",
              marginLeft: "env(safe-area-inset-left)",
              width: "80%",
              maxWidth: "320px",
              display: "none",
              flexDirection: "column",
              gap: "6px",
              background: "rgba(0, 0, 0, 0.45)",
              border: "2px solid rgba(255, 255, 255, 0.5)",
              borderRadius: "8px",
            }
          }, header, contractRow.row, farLinkRow.row, rocketRow.row)

          const wrapper = HDiv({
            style: {
              left: "0px",
              top: "0px",
              width: "100%",
              height: "100%"
            }
          }, moneyButton, infoPanel)

          return wrapper
        },
        onTick: (world) => {
          if (!moneyButton) return

          if (infoOpen && !world.client!.busy) {
            infoOpen = false
          }

          if (infoPanel) {
            infoPanel.style.display = infoOpen ? "flex" : "none"
          }

          moneyButton.style.boxShadow = infoOpen ? "0 0 10px 2px rgba(255, 255, 255, 0.5)" : "none"

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
