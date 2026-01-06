import { canvasAppend, HtmlButton, HtmlJoystick, World } from "@piggo-gg/core"

type MobileUI = null | { update: () => void }

export const MobileUI = (world: World): MobileUI => {
  if (!world.client?.mobile || !world.pixi) return null

  const leftJoystick = HtmlJoystick({ client: world.client, side: "left", label: "move" })
  const rightJoystick = HtmlJoystick({ client: world.client, side: "right", label: "aim" })

  const shootButton = HtmlButton({
    text: "shoot",
    style: {
      bottom: "140px",
      right: "10%",
      transform: "translate(50%)",
      width: "70px",
      height: "34px",
      fontSize: "14px",
      borderRadius: "10px",
      backgroundImage: "none",
      backgroundColor: "rgba(255, 90, 60, 0.5)",
      border: "2px solid white"
    },
    onClick: () => {
      if (world.client?.menu) return
      world.actions.push(
        world.tick + 2, world.client?.character()?.id ?? "", { actionId: "shoot" }
      )
      shootButton.style.backgroundColor = "rgba(255, 90, 60, 0.9)"
    },
    onRelease: () => {
      shootButton.style.backgroundColor = "rgba(255, 90, 60, 0.5)"
    }
  })

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

  canvasAppend(leftJoystick, rightJoystick, shootButton, menuButton)

  return {
    update: () => {
      if (!world.client?.mobile) return

      const hidden = world.client.menu
        || world.settings<{ showControls: boolean }>().showControls === false

      const visibility = hidden ? "hidden" : "visible"
      leftJoystick.style.visibility = visibility
      rightJoystick.style.visibility = visibility
      shootButton.style.visibility = visibility
    }
  }
}
