import { Entity, HtmlDiv, HtmlText, NPC, Position } from "@piggo-gg/core"

export const D3Profile = (): Entity => {

  let init = false

  const container = HtmlDiv({
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    width: "auto",
    minWidth: "165px",
    height: "46px",
    left: "10px",
    top: "10px",
    borderRadius: "10px"
  })

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
    id: "D3Profile",
    components: {
      position: Position(),
      npc: NPC({
        behavior: (_, world) => {
          if (!init) {
            world.three?.append(container)
            container.style.visibility = world.client?.mobile ? "hidden" : "visible"
            init = true
          }

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
