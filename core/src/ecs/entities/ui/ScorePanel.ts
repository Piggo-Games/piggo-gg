import { Entity, HDiv, HText, NPC } from "@piggo-gg/core"

export const ScorePanel = () => {

  let init = false

  const div = HDiv({
    style: {
      display: "flex", left: "50%", top: "6px", transform: "translate(-50%)", gap: "8px"
    }
  })

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

  const left = ScoreBlock("#ffaacccc")
  const right = ScoreBlock("#00ccffcc")

  div.append(left, right)

  return Entity({
    id: "scorepanel",
    components: {
      npc: NPC({
        behavior: (_, world) => {
          if (!init) {
            init = true
            document.body.appendChild(div)
          }

          div.style.visibility = world.client?.busy ? "hidden" : "visible"

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
