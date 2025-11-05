import { CSS } from "@piggo-gg/core"

const defaults: CSS = {
  position: "absolute",
  scrollbarWidth: "none",
  msOverflowStyle: "none",
  outline: "none",
  touchAction: "none",
  borderRadius: "8px",
  pointerEvents: "none"
}

export type HtmlDiv = HTMLDivElement

export const HtmlDiv = (style: CSS = {}, id?: string): HtmlDiv => {
  const div = document.createElement("div")

  div.classList.add("lex")

  Object.assign(div.style, defaults)
  Object.assign(div.style, style)

  if (id) div.id = id

  div.oncontextmenu = (e) => e.preventDefault()

  if (style.touchAction === undefined) {
    div.ontouchstart = (e) => e.preventDefault()
    div.ontouchend = (e) => e.preventDefault()
    div.ontouchmove = (e) => e.preventDefault()
    div.ontouchcancel = (e) => e.preventDefault()
  }

  return div
}

export type RefreshableDiv = { div: HTMLElement, update: () => void }
