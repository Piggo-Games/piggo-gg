import { Entity, HDiv, HText, NPC, Position, Renderable, TeamColors, pixiText } from "@piggo-gg/core"
import { Graphics } from "pixi.js"

export const ScorePanelHtml = () => {

  let init = false

  const div = HDiv({
    style: {
      display: "flex",
      left: "50%",
      top: "6px",
      transform: "translate(-50%)",
      border: "1px solid blue",
      width: "fit-content",
      height: "fit-content"
    }
  })

  const left = HText({
    text: "0",
    style: {
      backgroundColor: "#ffaacc",
      color: "white",
      fontSize: "36px",
      width: "46px",
      height: "46px",
      lineHeight: "46px",
      textAlign: "center",
      border: "2px solid white"
    }
  })

  div.appendChild(left)

  return Entity({
    id: "scorepanelhtml",
    components: {
      npc: NPC({
        behavior: () => {
          if (!init) {
            init = true
            document.body.appendChild(div)
          }
        }
      })
    }
  })
}

export const ScorePanel = (): Entity => {

  let left = 0
  let right = 0

  const textLeft = pixiText({
    text: "0",
    pos: { x: -30, y: 30 },
    anchor: { x: 0.5, y: 0.5 },
    style: { fill: 0xffffff, fontSize: 32, dropShadow: true }
  })

  const textRight = pixiText({
    text: "0",
    pos: { x: 30, y: 30 },
    anchor: { x: 0.5, y: 0.5 },
    style: { fill: 0xffffff, fontSize: 32, dropShadow: true }
  })

  const scorePanel = Entity<Position>({
    id: "scorepanel",
    components: {
      position: Position({ screenFixed: true }),
      renderable: Renderable({
        zIndex: 10,
        anchor: { x: 0.5, y: 0 },
        onTick: ({ world }) => {
          const state = world.game.state as { scoreLeft: number, scoreRight: number }
          if (left !== state.scoreLeft || right !== state.scoreRight) {
            left = state.scoreLeft
            right = state.scoreRight

            textLeft.text = left.toString()
            textRight.text = right.toString()
          }
        },
        setup: async (r, renderer) => {
          const g = new Graphics()
          g.roundRect(-55, 5, 50, 50, 10)
            .fill({ color: TeamColors[1], alpha: 0.7 })
            .stroke({ color: 0xffffff, width: 2, alpha: 0.9 })
            .roundRect(5, 5, 50, 50, 10)
            .fill({ color: TeamColors[2], alpha: 0.7 })
            .stroke({ color: 0xffffff, width: 2, alpha: 0.9 })

          r.c.addChild(g, textLeft, textRight)

          const { width } = renderer.wh()
          scorePanel.components.position.setPosition({ x: width / 2, y: 0 })
        }
      })
    }
  })

  return scorePanel
}
