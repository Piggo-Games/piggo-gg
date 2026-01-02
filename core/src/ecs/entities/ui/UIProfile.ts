import { Entity, Html, HtmlDiv, HtmlText, Position } from "@piggo-gg/core"

export const UIProfile = (): Entity => {

  const container = HtmlDiv({
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    width: "auto",
    minWidth: "165px",
    height: "46px",
    left: "10px",
    top: "10px"
  }, "UIProfile")

  const name = HtmlText({
    text: "",
    style: {
      fontSize: "22px",
      padding: "10px",
      position: "relative",
      textAlign: "center"
    }
  })

  container.appendChild(name)

  const profile = Entity({
    id: "UIProfile",
    components: {
      position: Position(),
      html: Html({
        init: (world) => {
          container.style.visibility = world.client?.mobile ? "hidden" : "visible"

          return container
        },
        onTick: (world) => {
          const playerName = world.client?.playerName()
          if (playerName && playerName !== name.textContent) {
            if (world.tick < 20) return
            name.textContent = playerName
          }
        }
      })
    }
  })
  return profile
}
