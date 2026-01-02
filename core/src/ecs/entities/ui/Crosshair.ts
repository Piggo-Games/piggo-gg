import { CraftSettings, Entity, Html, HtmlDiv, Position } from "@piggo-gg/core"

export const Crosshair = () => {

  let div: HTMLDivElement | undefined

  const crosshair = Entity({
    id: "crosshair",
    components: {
      position: Position(),
      html: Html({
        init: (world) => {
          if (!world.client) return null

          div = HtmlDiv({
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            width: "5px",
            height: "5px",
            backgroundColor: "rgba(0, 255, 255, 1)",
            borderRadius: "50%",
            pointerEvents: "none"
          })

          return div
        },
        onTick: (world) => {
          if (!div) return

          const settings = world.settings<CraftSettings>()
          if (!world.client || !world.three) return

          const locked = world.client.mobile ? !world.client.menu : document.pointerLockElement
          const item = world.client?.character()?.components.inventory?.activeItem(world)

          const fpsCamera = world.three?.camera.mode === "first"

          div.style.visibility = (locked && item && settings.showCrosshair && fpsCamera && !world.client.bufferDown.get("tab")) ? "visible" : "hidden"
        }
      })
    }
  })

  return crosshair
}
