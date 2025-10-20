import { Entity, HDiv, HText, NPC, Player, Position, TeamNumber } from "@piggo-gg/core"

export const Scoreboard = () => {

  let init = false
  const players: string[] = []

  const team1 = HDiv({
    style: {
      width: "96%",
      left: "50%",
      transform: "translate(-50%)",
      height: "46%",

      // borderBottom: "2px solid yellow",
    }
  })

  const team2 = HDiv({
    style: {
      width: "96%",
      left: "50%",
      transform: "translate(-50%)",
      height: "46%",

      top: "50%",
      // borderBottom: "2px solid green",
    }
  })

  const wrapper = HDiv({
    style: {
      left: "50%",
      top: "50%",
      transform: "translate(-50%, -50%)",
      display: "flex",
      flexDirection: "column",
      border: "2px solid white",
      backgroundColor: "rgba(0, 0, 0, 0.2)",

      width: "400px",
      height: "300px",

      // visibility: "hidden"
    }
  },
    team1,
    team2
  )

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

              const { team } = p.components.team.data
              const row = ScoreboardRow(p, team)

              if (team === 1) {
                team1.appendChild(row)
              } else {
                team2.appendChild(row)
              }
            }
          }

          // wrapper.style.visibility = world.client?.bufferDown.get("tab") ? "visible" : "hidden"
        }
      })
    }
  })

  return scoreboard
}

const ScoreboardRow = (player: Player, team: TeamNumber) => {
  const row = HDiv({
    style: {
      position: "relative",
      marginTop: "6px",
      width: "100%",
      left: "50%",
      transform: "translate(-50%)",
      height: "28px",
      border: "2px solid white",
      backgroundColor: team === 1 ? "rgba(255, 0, 0, 0.2)" : "rgba(0, 255, 0, 0.2)",
    }
  }, HText({
    text: player.components.pc.data.name
  }))

  return row
}
