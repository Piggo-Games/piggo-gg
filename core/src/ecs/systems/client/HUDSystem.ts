import {
  HtmlButton, HtmlText, ClientSystemBuilder, ogButtonStyle, HDiv, HImg
} from "@piggo-gg/core"

type Cluster = {
  buttons: string[][]
  label: string
  fontSize?: `${number}px`
}

export type HUDSystemProps = {
  direction?: "column" | "row"
  from?: { top: number, left: number }
  clusters: Cluster[]
}

const mb = ["mb1", "mb2", "mb3"]

export const HUDSystem = (props: HUDSystemProps) => ClientSystemBuilder({
  id: "HUDSystem",
  init: (world) => {
    const { client } = world
    if (!client || client.mobile) return

    const wrapper = HDiv({
      style: {
        bottom: "20px",
        left: props.direction === "row" ? "50%" : "120px",
        display: "flex",
        flexDirection: props.direction || "column",
        width: "fit-content",
        height: "fit-content",
        alignItems: props.direction === "row" ? "flex-end" : "center",
        transform: "translate(-50%)",
        gap: "3vh",
        // border: "1px solid red"
      }
    })

    if (props.from) {
      wrapper.style.top = `${props.from.top}px`
      wrapper.style.left = `${props.from.left}px`
      wrapper.style.bottom = ""
      wrapper.style.transform = "translate(0%)"
    }

    document.getElementById("canvas-parent")?.append(wrapper)

    let buttonElements: { element: HTMLElement, key: string }[] = []

    for (const cluster of props.clusters) {
      const clusterDiv = HDiv({
        style: {
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          position: "relative",
          width: "fit-content",
          height: "fit-content",
          justifyContent: "center",
          // border: "1px solid green"
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
          const btn = mb.includes(button) ? KeyImg(`${button}.svg`) : KeyButton({ text: button })

          rowDiv.appendChild(btn)
          buttonElements.push({ element: btn, key: button.toLowerCase() })
        }
      }

      const label = KeyLabel(cluster.label, cluster.fontSize ?? "1.8vh")
      clusterDiv.appendChild(label)
    }

    const active = "rgba(0, 160, 200, 0.6)"
    const inactive = "rgba(0, 0, 0, 0.3)"

    return {
      id: "HUDSystem",
      query: [],
      priority: 0,
      onTick: () => {
        const settings = world.settings<{ showControls: boolean }>()
        wrapper.style.visibility = settings.showControls ? "visible" : "hidden"

        if (!settings.showControls) return

        const down = client.bufferDown.all()?.map(key => key.key)
        if (down) {
          for (const btn of buttonElements) {
            let check = [btn.key]
            if (btn.key === "spacebar") check = [" "]
            if (btn.key === "mb3") check = ["scrolldown", "scrollup"]

            if (mb.includes(btn.key)) {
              btn.element.style.filter = check.some(x => down.includes(x)) ? "sepia(83%) saturate(8000%) hue-rotate(170deg)" : ""
            } else {
              btn.element.style.backgroundColor = check.some(x => down.includes(x)) ? active : inactive
            }
          }
        }
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
    paddingRight: "1.2vh",
    paddingLeft: "1.2vh",
    height: "3.6vh",
    fontSize: "2vh",
    ...ogButtonStyle
  }
})

const KeyImg = (src: string) => HImg({
  src,
  style: {
    width: "3.6vh",
    position: "relative",
    transform: "translate(0%)"
  }
})

const KeyLabel = (text: string, fontSize: `${number}px` | `${number}vh`) => HtmlText({
  text,
  style: {
    position: "relative",
    textAlign: "center",
    marginTop: "6px",
    fontSize: fontSize
  }
})
