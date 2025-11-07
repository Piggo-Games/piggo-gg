import { CSS } from "@piggo-gg/core"

export type HtmlButton = HTMLButtonElement

export const HtmlButton = (props: HtmlButtonProps): HtmlButton => {
  const b = document.createElement("button")
  Object.assign(b.style, defaults)

  b.classList.add("lex")

  if (props.text) b.textContent = props.text

  if (props.onClick || props.onRelease) b.style.pointerEvents = "auto"
  if (props.onClick) b.addEventListener("pointerdown", props.onClick)
  if (props.onRelease) b.addEventListener("pointerup", props.onRelease)
  if (props.onHover) b.addEventListener("pointerover", props.onHover)
  if (props.onHoverOut) b.addEventListener("pointerout", props.onHoverOut)

  b.oncontextmenu = (e) => e.preventDefault()
  b.ontouchstart = (e) => e.preventDefault()
  b.ontouchend = (e) => e.preventDefault()
  b.ontouchmove = (e) => e.preventDefault()
  b.ontouchcancel = (e) => e.preventDefault()

  Object.assign(b.style, props.style)

  return b
}

export const ogButtonStyle: CSS = {
  backgroundImage: "",
  backgroundOrigin: "padding-box",
  backgroundClip: "border-box",
  border: "2px solid white"
}

const defaults: CSS = {
  position: "absolute",
  fontFamily: "Courier New",
  fontWeight: "bold",
  fontSize: "21px",
  textShadow: "2px 2px 1px rgba(0, 0, 0, 0.5)",
  backgroundColor: "rgba(0, 0, 0, 0.4)",
  color: "#ffffff",
  pointerEvents: "none",
  borderRadius: "8px",
  flexShrink: 0,
  padding: "0px",

  border: "2px solid transparent",
  backgroundImage: "linear-gradient(black, black), linear-gradient(180deg, white, 90%, #999999)",
  backgroundOrigin: "border-box",
  backgroundClip: "content-box, border-box"
}

export type HtmlButtonProps = {
  text?: string
  style?: CSS
  onClick?: (event: MouseEvent) => void
  onRelease?: (event: MouseEvent) => void
  onHover?: (event: MouseEvent) => void
  onHoverOut?: (event: MouseEvent) => void
}

export const styleButton = (button: HtmlButton, active: boolean, hovered: boolean): void => {
  button.style.boxShadow = active && hovered ? "0 0 6px 2px white" : "none"
  button.style.opacity = active ? "1" : "0.7"
}

export const styleSwitch = (button: HtmlButton, enabled: boolean, hovered: boolean): void => {
  if (enabled) {
    button.textContent = "on"
    button.style.border = "2px solid #00ff00"
    button.style.color = "#00ff00"
  } else {
    button.textContent = "off"
    button.style.border = "2px solid #ff0000"
    button.style.color = "#ff0000"
  }
}
