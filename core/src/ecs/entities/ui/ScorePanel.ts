import { Entity, HDiv, HText, Html } from "@piggo-gg/core"

export const ScorePanel = () => {

  let left: HTMLDivElement | undefined
  let right: HTMLDivElement | undefined

  const ScoreBlock = (color: `#${string}`) => HText({
    text: "0",
    style: {
      position: "relative",
      backgroundColor: color,
      color: "white",
      fontSize: "36px",
      width: "46px",
      height: "46px",
      lineHeight: "46px",
      textAlign: "center",
      border: "2px solid white"
    }
  })

  return Entity({
    id: "scorepanel",
    components: {
      html: Html({
        init: (world) => {
          if (!world.client) return null

          const div = HDiv({
            style: {
              display: "flex", left: "50%", top: "6px", transform: "translate(-50%)", gap: "8px"
            }
          })

          left = ScoreBlock("#ffaacccc")
          right = ScoreBlock("#00ccffcc")

          div.append(left, right)

          return div
        },
        onTick: (world) => {
          if (!left || !right) return

          const { scoreLeft, scoreRight } = world.game.state as { scoreLeft: number, scoreRight: number }

          if (Number(left.textContent) !== scoreLeft || Number(right.textContent) !== scoreRight) {
            left.textContent = scoreLeft.toString()
            right.textContent = scoreRight.toString()
          }
        }
      })
    }
  })
}
