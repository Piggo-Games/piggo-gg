import {
  HtmlButton, HtmlText, ClientSystemBuilder, HtmlDiv, HtmlInventory, ogButtonStyle
} from "@piggo-gg/core"

export const HUDSystem = ClientSystemBuilder({
  id: "HUDSystem",
  init: (world) => {
    const { three, client } = world
    if (!three || !client) return

    if (client.mobile) return

    const bottom = 40
    const left = 120

    const aButton = KeyButton({ text: "A", left: left - 50, bottom: bottom + 70 })
    const dButton = KeyButton({ text: "D", left: left + 50, bottom: bottom + 70 })
    const sButton = KeyButton({ text: "S", left, bottom: bottom + 70 })
    const wButton = KeyButton({ text: "W", left, bottom: bottom + 120 })
    const moveLabel = KeyLabel("move", left, bottom + 40)

    const rButton = KeyButton({ text: "r", left, bottom: bottom + 320 })
    const reloadLabel = KeyLabel("reload", left, bottom + 290)

    const cButton = KeyButton({ text: "c", left, bottom: bottom + 430, visible: false })
    const teamLabel = KeyLabel("switch team", left, bottom + 400, false)

    const zButton = KeyButton({ text: "z", left, bottom: bottom + 540, visible: true })
    const readyLabel = KeyLabel("ready", left, bottom + 510, true)

    // const boostButton = KeyButton({ text: "shift", left, bottom, width: 100 })
    // const boostLabel = KeyLabel("boost", left, bottom - 10)

    const jumpButton = KeyButton({ text: "spacebar", left, bottom: bottom + 220, width: 160 })
    const jumpLabel = KeyLabel("jump", left, bottom + 190)

    const scoreText = HtmlText({
      text: "",
      style: {
        left: `50%`,
        bottom: "50px",
        fontSize: "28px",
        color: "#ffffff",
        transform: "translate(-50%)",
      }
    })

    const posText = HtmlText({
      text: "0|0|0",
      style: {
        left: `25%`,
        bottom: `20px`,
        fontSize: "22px",
        color: "#00ffff",
        transform: "translate(-50%)",
        visibility: "hidden"
      }
    })

    const controls = HtmlDiv({
      bottom: "0px",
      left: "0px",
      pointerEvents: "none",
      border: ""
    })

    controls.appendChild(aButton)
    controls.appendChild(dButton)
    controls.appendChild(sButton)
    controls.appendChild(wButton)
    controls.appendChild(rButton)
    controls.appendChild(cButton)
    controls.appendChild(zButton)

    controls.appendChild(jumpButton)
    controls.appendChild(teamLabel)
    controls.appendChild(reloadLabel)
    controls.appendChild(moveLabel)
    controls.appendChild(jumpLabel)
    controls.appendChild(readyLabel)

    if (world.game.id === "craft") {
      // controls.appendChild(boostButton)
      // controls.appendChild(boostLabel)
    }

    three.append(controls)
    three.append(scoreText)
    three.append(posText)

    const inventory = HtmlInventory(client)

    // TODO tech debt
    if (world.game.id === "craft") {
      three.append(inventory.div)
    }

    const active = "rgba(0, 160, 200, 0.6)"
    const inactive = "rgba(0, 0, 0, 0.3)"

    let currentApplesEaten = -1

    return {
      id: "HUDSystem",
      query: [],
      priority: 10,
      onTick: () => {
        const settings = world.settings<{ showControls: boolean }>()
        controls.style.display = settings.showControls ? "block" : "none"

        const down = client.bufferDown.all()?.map(key => key.key)
        if (down) {
          aButton.style.backgroundColor = down.includes("a") ? active : inactive
          dButton.style.backgroundColor = down.includes("d") ? active : inactive
          sButton.style.backgroundColor = down.includes("s") ? active : inactive
          wButton.style.backgroundColor = down.includes("w") ? active : inactive
          rButton.style.backgroundColor = down.includes("r") ? active : inactive
          cButton.style.backgroundColor = down.includes("c") ? active : inactive
          zButton.style.backgroundColor = down.includes("z") ? active : inactive
          // boostButton.style.backgroundColor = down.includes("shift") ? active : inactive
          jumpButton.style.backgroundColor = down.includes(" ") ? active : inactive
        }

        const pc = client.character()
        if (pc) {
          const { flying, x, y, z } = pc.components.position.data

          const visibility = flying ? "hidden" : "visible"

          jumpButton.style.visibility = visibility
          jumpLabel.style.visibility = visibility

          if (client.env !== "production" && world.debug) {
            posText.innerHTML = `<span style='color: #00ffff'>${x.toFixed(2)}</span><span style='color: #ffff00'> ${y.toFixed(2)}</span><span style='color: #ff33cc'> ${z.toFixed(2)}</span><span style='color: #6bc6ffff'> ${client.controls.localAim.x.toFixed(2)}</span>`
            posText.style.visibility = "visible"
          } else {
            posText.style.visibility = "hidden"
          }
        }

        inventory.update()

        const state = world.state<{ phase: string }>()

        const isConnected = world.client?.net.synced
        const isWarmup = state.phase === "warmup"

        cButton.style.visibility = isWarmup ? "visible" : "hidden"
        teamLabel.style.visibility = isWarmup ? "visible" : "hidden"

        zButton.style.visibility = isWarmup && isConnected ? "visible" : "hidden"
        readyLabel.style.visibility = isWarmup && isConnected ? "visible" : "hidden"
      }
    }
  }
})

type KeyButtonProps = {
  text: string
  left: number
  bottom: number
  visible?: boolean
  width?: number
}

const KeyButton = (props: KeyButtonProps) => HtmlButton({
  text: props.text,
  style: {
    left: `${props.left}px`,
    bottom: `${props.bottom}px`,
    width: `${props.width ?? 36}px`,
    height: "36px",
    fontSize: "20px",
    visibility: props.visible === false ? "hidden" : "visible",
    transform: "translate(-50%)",
    ...ogButtonStyle
  }
})

const KeyLabel = (text: string, left: number, bottom: number, visible = true) => HtmlText({
  text,
  style: {
    left: `${left}px`,
    bottom: `${bottom}px`,
    width: "200px",
    textAlign: "center",
    visibility: visible ? "visible" : "hidden",
    transform: "translate(-50%)"
  }
})
