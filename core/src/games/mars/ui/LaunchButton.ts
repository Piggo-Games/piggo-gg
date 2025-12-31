import { Entity, HButton, HImg, Html, Position } from "@piggo-gg/core"
import type { MarsState } from "../Mars"

export const LaunchButton = (): Entity => {
  let launchButton: HTMLButtonElement | undefined

  const syncButton = (launching: boolean) => {
    if (!launchButton) return

    launchButton.disabled = launching
    launchButton.style.opacity = launching ? "0" : "1"
    launchButton.style.pointerEvents = launching ? "none" : "auto"
    launchButton.style.filter = launching ? "grayscale(0.2)" : "none"
  }

  return Entity({
    id: "marsLaunchButton",
    components: {
      position: Position(),
      html: Html({
        init: (world) => {
          console.log("init launch button")
          launchButton = HButton({
            style: {
              left: "90%",
              top: "50%",
              marginBottom: "env(safe-area-inset-bottom)",
              transform: "translate(-50%, -50%)",
              width: "60px",
              height: "60px",
              borderRadius: "999px",
              fontSize: "26px",
              backgroundColor: "#2fbb4c",
              backgroundImage: "linear-gradient(180deg, #64e36f 0%, #2fbb4c 100%)",
              border: "3px solid #0f7d2f",
              color: "#ffffff",
              pointerEvents: "auto"
            },
            onClick: () => {
              if (world.client?.menu) return

              const state = world.state<MarsState>()
              if (state.launching) return

              const rocket = world.entity("rocket")?.components.position
              rocket?.setPosition({ z: 0 })

              state.launching = true
              syncButton(true)
            }
          }, HImg({
            src: "launch.svg",
            style: { left: "calc(50% - 1px)", top: "50%", height: "60px" }
          }))

          syncButton(world.state<MarsState>().launching)

          return launchButton
        },
        onTick: (world) => {
          if (!launchButton) return

          const { launching } = world.state<MarsState>()
          if (launchButton.disabled !== launching) {
            syncButton(launching)
          }
        }
      })
    }
  })
}
