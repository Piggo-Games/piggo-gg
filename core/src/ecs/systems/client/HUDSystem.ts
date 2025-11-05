import {
  HtmlButton, HtmlText, ClientSystemBuilder, HtmlInventory, ogButtonStyle, HDiv
} from "@piggo-gg/core"

type Cluster = {
  buttons: string[][]
  label: string
}

export type HUDSystemProps = {
  clusters: Cluster[]
}

export const HUDSystem = (props: HUDSystemProps) => ClientSystemBuilder({
  id: "HUDSystem",
  init: (world) => {
    const { three, client } = world
    if (!three || !client) return

    if (client.mobile) return

    const wrapper = HDiv({
      style: { bottom: "20px", left: "20px", display: "flex" }
    })

    three.append(wrapper)

    let buttonElements: { element: HTMLButtonElement, key: string }[] = []

    for (const cluster of props.clusters) {
      const clusterDiv = HDiv({
        style: {
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          position: "relative",
          width: "fit-content",
          height: "fit-content",
          marginBottom: "30px",
          justifyContent: "center",
        }
      })
      wrapper.appendChild(clusterDiv)

      const keyWrapper = HDiv({
        style: {
          position: "relative",
          height: "fit-content",
          width: "fit-content",
          display: "flex",
          flexDirection: "column-reverse",
          gap: "8px",
          justifyContent: "center",
          alignItems: "center"
        }
      })
      clusterDiv.appendChild(keyWrapper)

      for (const row of cluster.buttons) {

        const rowDiv = HDiv({
          style: {
            position: "relative",
            gap: "8px",
            display: "flex",
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            width: "fit-content",
            height: "fit-content"
          }
        })
        keyWrapper.appendChild(rowDiv)

        for (const button of row) {
          const btn = KeyButton({
            text: button
          })
          rowDiv.appendChild(btn)
          buttonElements.push({ element: btn, key: button.toLowerCase() })
        }
      }

      const label = KeyLabel(cluster.label)
      clusterDiv.appendChild(label)
    }

    // const bottom = 40
    // const left = 120

    // const aButton = KeyButton({ text: "A", left: left - 50, bottom: bottom + 70 })
    // const dButton = KeyButton({ text: "D", left: left + 50, bottom: bottom + 70 })
    // const sButton = KeyButton({ text: "S", left, bottom: bottom + 70 })
    // const wButton = KeyButton({ text: "W", left, bottom: bottom + 120 })
    // const moveLabel = KeyLabel("move", left, bottom + 40)

    // const rButton = KeyButton({ text: "r", left, bottom: bottom + 320 })
    // const reloadLabel = KeyLabel("reload", left, bottom + 290)

    // const cButton = KeyButton({ text: "c", left, bottom: bottom + 430, visible: false })
    // const teamLabel = KeyLabel("switch team", left, bottom + 400, false)

    // const zButton = KeyButton({ text: "z", left, bottom: bottom + 540, visible: true })
    // const readyLabel = KeyLabel("ready", left, bottom + 510, true)

    // // const boostButton = KeyButton({ text: "shift", left, bottom, width: 100 })
    // // const boostLabel = KeyLabel("boost", left, bottom - 10)

    // const jumpButton = KeyButton({ text: "spacebar", left, bottom: bottom + 220, width: 160 })
    // const jumpLabel = KeyLabel("jump", left, bottom + 190)

    // const scoreText = HtmlText({
    //   text: "",
    //   style: {
    //     left: `50%`,
    //     bottom: "50px",
    //     fontSize: "28px",
    //     color: "#ffffff",
    //     transform: "translate(-50%)",
    //   }
    // })

    // const posText = HtmlText({
    //   text: "0|0|0",
    //   style: {
    //     left: `25%`,
    //     bottom: `20px`,
    //     fontSize: "22px",
    //     color: "#00ffff",
    //     transform: "translate(-50%)",
    //     visibility: "hidden"
    //   }
    // })

    // controls.appendChild(aButton)
    // controls.appendChild(dButton)
    // controls.appendChild(sButton)
    // controls.appendChild(wButton)
    // controls.appendChild(rButton)
    // controls.appendChild(cButton)
    // controls.appendChild(zButton)

    // controls.appendChild(jumpButton)
    // controls.appendChild(teamLabel)
    // controls.appendChild(reloadLabel)
    // controls.appendChild(moveLabel)
    // controls.appendChild(jumpLabel)
    // controls.appendChild(readyLabel)

    // if (world.game.id === "craft") {
    // controls.appendChild(boostButton)
    // controls.appendChild(boostLabel)
    // }
    // three.append(scoreText)
    // three.append(posText)

    const inventory = HtmlInventory(client)

    // TODO tech debt
    if (world.game.id === "craft") {
      three.append(inventory.div)
    }

    const active = "rgba(0, 160, 200, 0.6)"
    const inactive = "rgba(0, 0, 0, 0.3)"

    return {
      id: "HUDSystem",
      query: [],
      priority: 10,
      onTick: () => {
        const settings = world.settings<{ showControls: boolean }>()
        wrapper.style.display = settings.showControls ? "block" : "none"

        const down = client.bufferDown.all()?.map(key => key.key)
        if (down) {
          for (const btn of buttonElements) {
            const check = btn.key === "spacebar" ? " " : btn.key
            btn.element.style.backgroundColor = down.includes(check) ? active : inactive
          }
        }

        const pc = client.character()
        if (pc) {
          const { flying, x, y, z } = pc.components.position.data

          const visibility = flying ? "hidden" : "visible"

          // jumpButton.style.visibility = visibility
          // jumpLabel.style.visibility = visibility

          // if (client.env !== "production" && world.debug) {
          //   posText.innerHTML = `<span style='color: #00ffff'>${x.toFixed(2)}</span><span style='color: #ffff00'> ${y.toFixed(2)}</span><span style='color: #ff33cc'> ${z.toFixed(2)}</span><span style='color: #6bc6ffff'> ${client.controls.localAim.x.toFixed(2)}</span>`
          //   posText.style.visibility = "visible"
          // } else {
          //   posText.style.visibility = "hidden"
          // }
        }

        inventory.update()

        const state = world.state<{ phase: string }>()

        const isConnected = world.client?.net.synced
        const isWarmup = state.phase === "warmup"

        // cButton.style.visibility = isWarmup ? "visible" : "hidden"
        // teamLabel.style.visibility = isWarmup ? "visible" : "hidden"

        // zButton.style.visibility = isWarmup && isConnected ? "visible" : "hidden"
        // readyLabel.style.visibility = isWarmup && isConnected ? "visible" : "hidden"
      }
    }
  }
})

type KeyButtonProps = {
  text: string
  visible?: boolean
}

const KeyButton = (props: KeyButtonProps) => HtmlButton({
  text: props.text,
  style: {
    position: "relative",
    width: "fit-content",
    paddingRight: "12px",
    paddingLeft: "12px",
    height: "36px",
    fontSize: "20px",
    visibility: props.visible === false ? "hidden" : "visible",
    ...ogButtonStyle
  }
})

const KeyLabel = (text: string) => HtmlText({
  text,
  style: {
    position: "relative",
    width: "200px",
    textAlign: "center",
    marginTop: "6px"
  }
})
