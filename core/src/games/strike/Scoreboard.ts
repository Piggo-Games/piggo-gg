import { Entity, HDiv, HText, NPC, Player, Position } from "@piggo-gg/core"

export const Scoreboard = () => {

  let init = false
  const players: string[] = []

  const wrapper = HDiv({
    style: {
      left: "50%",
      top: "50%",
      transform: "translate(-50%, -50%)",
      display: "flex",
      flexDirection: "column",
      border: "2px solid blue",

      width: "400px",
      height: "300px",

      // visibility: "hidden"
    }
  })

  const scoreboard = Entity({
    id: "scoreboard",
    components: {
      position: Position(),
      npc: NPC({
        behavior: (_, world) => {
          if (!init) {
            init = true
            document.body.appendChild(wrapper)
          }

          const worldPlayers = world.players()
          for (const p of worldPlayers) {
            if (!players.includes(p.id)) {
              players.push(p.id)
              const row = ScoreboardRow(p)
              wrapper.appendChild(row)
            }
          }

          // wrapper.style.visibility = world.client?.bufferDown.get("tab") ? "visible" : "hidden"
        }
      })
    }
  })

  return scoreboard
}

const ScoreboardRow = (player: Player) => {
  const row = HDiv({
    style: {
      position: "relative",
      margin: "4px",
      width: "96%",
      left: "50%",
      transform: "translate(-50%)",
      height: "24px",
      border: "1px solid red",
    }
  }, HText({
    text: player.components.pc.data.name
  }))

  return row
}
