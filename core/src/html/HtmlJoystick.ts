import { Client, Entity, HDiv, HText, HtmlDiv, min, NPC, pow, sqrt, XY } from "@piggo-gg/core"

export type HtmlJoystickProps = {
  client: Client
  side: "left" | "right"
  radius?: number
  label?: string
}

export const HtmlJoystick = ({ client, side, radius = 40, label }: HtmlJoystickProps): HtmlDiv => {

  const idle = side === "left" ? "rgba(0, 100, 200, 0.5)" : "rgba(200, 60, 200, 0.5)"
  const active = side === "left" ? "rgba(0, 100, 200, 0.8)" : "rgba(200, 60, 200, 0.8)"

  const stick = HDiv({
    style: {
      ...side === "left" ? { left: "15%" } : { right: "15%" },
      backgroundColor: idle,
      width: `${radius * 2}px`,
      height: `${radius * 2}px`,
      borderRadius: "50%",
      bottom: "40px",
      pointerEvents: "auto",
      border: "2px solid white"
    }
  },
    HText({
      text: label || "",
      style: {
        color: "white",
        bottom: `-4px`,
        left: `50%`,
        fontSize: "16px",
        transform: "translate(-50%, 100%)"
      }
    })
  )

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
      client.controls.left = { power: pow(dist / 40, 2), angle: angle, active: true }
    } else {
      client.controls.right = { power: pow(dist / 40, 2), angle: angle, active: true }
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

export const HtmlJoystickEntity = (side: "left" | "right", label?: string): Entity => {

  let joystick: HtmlDiv | undefined = undefined
  let init = false

  return Entity({
    id: `joystick-${side}`,
    components: {
      npc: NPC({
        behavior: (_, world) => {
          if (!init && world.client?.mobile) {
            joystick = HtmlJoystick({ client: world.client, side, radius: 30, label: label ?? "" })
            document.body.appendChild(joystick)
            init = true
          }
        }
      })
    }
  })
}
