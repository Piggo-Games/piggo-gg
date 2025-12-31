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
          launchButton = HButton({
            style: {
              right: "16px",
              bottom: "16px",
              marginBottom: "env(safe-area-inset-bottom)",
              width: "60px",
              height: "60px",
              borderRadius: "999px",
              fontSize: "26px",
              backgroundColor: "#2fbb4c",
              backgroundImage: "linear-gradient(180deg, #64e36f 0%, #2fbb4c 100%)",
              border: "3px solid #0f7d2f",
              color: "#ffffff",
              pointerEvents: "auto",
              transition: "opacity 0.2s ease, box-shadow 0.2s ease, filter 0.3s ease"
            },
            onHover: () => {
              launchButton!.style.boxShadow = "0 0 10px 4px #64e36f"
            },
            onHoverOut: () => {
              launchButton!.style.boxShadow = "none"
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
