import { canvasAppend, HtmlButton, World } from "@piggo-gg/core"

type MobileUI = null | { update: () => void }

export const MobileUI = (world: World): MobileUI => {
  if (!world.client?.mobile || !world.pixi) return null

  const menuButton = HtmlButton({
    text: "menu",
    onClick: () => {
      world.client!.menu = !world.client!.menu
      menuButton.style.backgroundColor = "rgba(0, 160, 255, 0.4)"
    },
    onRelease: () => {
      menuButton.style.backgroundColor = "rgba(0, 0, 0 , 0.4)"
    },
    style: {
      marginTop: "env(safe-area-inset-top)",
      marginLeft: "env(safe-area-inset-left)",
      top: "10px",
      left: "10px",
      width: "80px"
    }
  })

  canvasAppend(menuButton)

  return {
    update: () => {}
  }
}
