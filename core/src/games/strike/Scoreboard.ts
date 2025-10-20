import { Entity, HDiv, HText, KDA, NPC, Player, Position, StrikeState, TeamNumber } from "@piggo-gg/core"

type RowData = {
  row: HTMLDivElement
  name: string
  team: TeamNumber
  kda: KDA
}

export const Scoreboard = () => {

  let init = false

  const playerData: Record<string, RowData> = {}

  const team1 = HDiv({
    style: {
      width: "96%", left: "50%", transform: "translate(-50%)", height: "46%"
    }
  })

  const team2 = HDiv({
    style: {
      width: "96%", left: "50%", transform: "translate(-50%)", height: "46%", top: "50%"
    }
  })

  const wrapper = HDiv({
    style: {
      left: "50%",
      top: "50%",
      width: "520px",
      height: "400px",
      transform: "translate(-50%, -50%)",
      display: "flex",
      flexDirection: "column",
      border: "2px solid white",
      backgroundColor: "rgba(0, 0, 0, 0.2)",
      visibility: "hidden"
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

          const players = world.players()
          const state = world.state<StrikeState>()

          // clean up removed players
          for (const pid in playerData) {
            if (!players.find(p => p.id === pid)) {
              const rowData = playerData[pid]
              rowData.row.parentElement?.removeChild(rowData.row)
              delete playerData[pid]
            }
          }

          for (const player of players) {

            const { team, pc } = player.components

            const playerKDA = state.kda[player.id] || "0|0|0"

            // clean up stale rows
            const rowData = playerData[player.id]
            if (rowData) {

              if (rowData.kda !== playerKDA || rowData.name !== pc.data.name) {
                rowData.row.parentElement?.removeChild(rowData.row)
                delete playerData[player.id]
              }
            }

            // add new row
            if (!playerData[player.id]) {

              const row = ScoreboardRow(player, team.data.team, playerKDA)

              playerData[player.id] = {
                row,
                name: pc.data.name,
                team: team.data.team,
                kda: playerKDA
              }

              if (team.data.team === 1) {
                console.log("adding to team 1")
                team1.appendChild(row)
              } else {
                team2.appendChild(row)
              }
            }
          }

          wrapper.style.visibility = world.client?.bufferDown.get("tab") ? "visible" : "hidden"
        }
      })
    }
  })

  return scoreboard
}

const ScoreboardRow = (player: Player, team: TeamNumber, kda: KDA) => HDiv({
  style: {
    position: "relative",
    marginTop: "6px",
    width: "100%",
    left: "50%",
    transform: "translate(-50%)",
    height: "28px",
    // border: "2px solid white",
    border: team === 1 ? "2px solid rgba(200, 0, 0, 1)" : "2px solid rgba(0, 200, 0, 1)",
    backgroundColor: team === 1 ? "rgba(255, 100, 100, 0.4)" : "rgba(100, 255, 100, 0.4)"
  }
}, HText({
  style: {
    left: "8px",
    fontSize: "24px",
    lineHeight: "28px"
  },
  text: player.components.pc.data.name
}),
  HText({
    style: {
      // left: "50%",
      // transform: "translate(-50%)",
      right: "8px",
      fontSize: "24px",
      lineHeight: "28px"
    },
    text: kda.replaceAll("|", " / ")
  })
)
