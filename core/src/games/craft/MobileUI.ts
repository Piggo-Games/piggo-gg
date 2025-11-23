import { HtmlButton, HtmlJoystick, World } from "@piggo-gg/core"

type MobileUI = null | { update: () => void }

// todo entity
export const MobileUI = (world: World): MobileUI => {
  if (!world.client?.mobile || !world.three) return null

  const leftJoystick = HtmlJoystick(world.client, "left")
  const rightJoystick = HtmlJoystick(world.client, "right")

  const povButton = HtmlButton({
    style: {
      bottom: "140px", left: "10%",
      // bottom: "170px", left: "calc(15% + 40px)",
      transform: "translate(-50%)",
      backgroundColor: "rgba(255, 150, 50, 0.5)",
      width: "36px", height: "36px", borderRadius: "50%",
      backgroundImage: "none",
      border: "2px solid white"
    },
    onClick: () => {
      const { camera } = world.three!
      camera.mode = camera.mode === "first" ? "third" : "first"
      povButton.style.backgroundColor = "rgba(255, 200, 50, 0.9)"
    },
    onRelease: () => {
      povButton.style.backgroundColor = "rgba(255, 150, 50, 0.5)"
    }
  })

  const transformButton = HtmlButton({
    style: {
      bottom: "140px", left: "10%",
      transform: "translate(-50%)",
      backgroundColor: "rgba(255, 150, 150, 0.5)",
      width: "36px", height: "36px", borderRadius: "50%",
      backgroundImage: "none",
      border: "2px solid white"
    },
    onClick: () => {
      world.actions.push(
        world.tick + 2, world.client?.character()?.id ?? "", { actionId: "transform" }
      )
      transformButton.style.backgroundColor = "rgba(255, 150, 150, 0.9)"
    },
    onRelease: () => {
      transformButton.style.backgroundColor = "rgba(255, 150, 150, 0.5)"
    }
  })

  const jumpButton = HtmlButton({
    style: {
      bottom: "140px", right: "10%",
      transform: "translate(50%)",
      backgroundColor: "rgba(20, 255, 60, 0.5)",
      width: "54px", height: "54px", borderRadius: "50%",
      backgroundImage: "none",
      border: "2px solid white"
    },
    onClick: () => {
      world.actions.push(
        world.tick + 2, world.client?.character()?.id ?? "", { actionId: "jump" }
      )
      jumpButton.style.backgroundColor = "rgba(20, 255, 60, 0.8)"
    },
    onRelease: () => {
      jumpButton.style.backgroundColor = "rgba(20, 255, 60, 0.5)"
    }
  })

  world.three?.append(povButton, jumpButton, leftJoystick, rightJoystick)

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

  world.three.append(menuButton)

  return {
    update: () => {
      if (!world.client?.mobile) return

      const { flying } = world.client.character()?.components.position.data ?? {}

      let hidden = (flying || world.client?.menu) || (world.settings<{ showControls: boolean }>().showControls === false)

      const visibility = hidden ? "hidden" : "visible"
      jumpButton.style.visibility = visibility // was disable while flying
      povButton.style.visibility = visibility
      transformButton.style.visibility = visibility
      leftJoystick.style.visibility = visibility
      rightJoystick.style.visibility = visibility
    }
  }
}
