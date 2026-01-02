import { Entity, HText, Html, Position, round } from "@piggo-gg/core"

export const HtmlFpsText = () => {

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
      html: Html({
        onTick: (world) => {
          if (!world.debug) {
            div.style.visibility = "hidden"
            return
          }

          div.style.visibility = "visible"

          const fps = round(world.client?.fps ?? 0)
          div.textContent = `fps: ${fps}`
        },
        init: () => {
          return div
        }
      })
    }
  })
}

export const HtmlLagText = () => {
  let last = 0
  let lastTick = 0

  const div = HText({
    style: {
      right: "16px",
      top: "36px",
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
      html: Html({
        onTick: (world) => {
          const lag = round(world.client?.net.ms ?? 0)
          div.style.visibility = world.client?.net.synced ? "visible" : "hidden"

          if (lag > last || world.tick - lastTick > 60) {
            last = lag
            lastTick = world.tick

            div.textContent = `ms: ${lag}`
          }
        },
        init: () => {
          return div
        }
      })
    }
  })
}
