import { Client, HtmlDiv, min, sqrt, XY } from "@piggo-gg/core"

export const HtmlJoystick = (client: Client, side: "left" | "right"): HtmlDiv => {

  const idle = side === "left" ? "rgba(200, 60, 200, 0.5)" : "rgba(0, 100, 200, 0.5)"
  const active = side === "left" ? "rgba(200, 60, 200, 0.8)" : "rgba(0, 100, 200, 0.8)"

  const stick = HtmlDiv({
    ...side === "left" ? { left: "15%" } : { right: "15%" },
    backgroundColor: idle,
    width: "80px",
    height: "80px",
    borderRadius: "50%",
    bottom: "40px",
    pointerEvents: "auto"
  })

  let center: XY = { x: 0, y: 0 }

  stick.onpointerdown = (e) => {
    e.preventDefault()

    center = { x: stick.offsetLeft + e.offsetX, y: stick.offsetTop + e.offsetY }

    stick.style.backgroundColor = active
  }

  stick.onpointermove = (e) => {
    const dx = e.clientX - center.x
    const dy = e.clientY - center.y
    const dist = min(40, sqrt(dx * dx + dy * dy))

    const angle = Math.atan2(dy, dx)
    const x = dist * Math.cos(angle)
    const y = dist * Math.sin(angle)

    stick.style.transform = `translate(${x}px, ${y}px)`

    if (side === "left") {
      client.controls.left = { power: dist / 40, angle: angle, active: true }
    } else {
      client.controls.right = { power: dist / 40, angle: angle, active: true }
    }
  }

  stick.onpointerup = () => {
    stick.style.backgroundColor = idle
    stick.style.transform = "translate(0, 0)"

    if (side === "left") {
      client.controls.left = { power: 0, angle: 0, active: false }
    } else {
      client.controls.right = { power: 0, angle: 0, active: false }
    }
  }

  return stick
}
