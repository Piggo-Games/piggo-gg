import { Entity, HText, NPC, Position, round } from "@piggo-gg/core"

export const HtmlFpsText = () => {
  let init = false

  const div = HText({
    style: {
      right: "16px",
      top: "16px",
      color: "#dddd00",
      textShadow: "none",
      visibility: "hidden",
      fontSize: "16px"
    },
    text: "fps: 0"
  })

  return Entity({
    id: "htmlFpsText",
    components: {
      position: Position(),
      npc: NPC({
        behavior: (_, world) => {
          if (!init) {
            document.getElementById("canvas-parent")?.appendChild(div)
            init = true
          }

          if (!world.debug) {
            div.style.visibility = "hidden"
            return
          }

          div.style.visibility = "visible"

          const fps = round(world.client?.fps ?? 0)
          div.textContent = `fps: ${fps}`
        }
      })
    }
  })
}

export const HtmlLagText = () => {

  let init = false

  let last = 0
  let lastTick = 0

  const div = HText({
    style: {
      right: "16px",
      bottom: "16px",
      color: "#00dd00",
      textShadow: "none",
      visibility: "hidden",
      fontSize: "16px"
    },
    text: "ms: 0"
  })

  return Entity({
    id: "htmlLagText",
    components: {
      position: Position(),
      npc: NPC({
        behavior: (_, world) => {
          if (!init) {
            document.getElementById("canvas-parent")?.appendChild(div)
            init = true
          }

          const lag = round(world.client?.net.ms ?? 0)
          div.style.visibility = world.client?.net.synced ? "visible" : "hidden"

          if (lag > last || world.tick - lastTick > 60) {
            last = lag
            lastTick = world.tick

            div.textContent = `ms: ${lag}`
          }
        }
      })
    }
  })
}
