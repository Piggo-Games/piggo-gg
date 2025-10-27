import { Entity, HDiv, HText, KDAstring, NPC, Position, StrikeState, TeamNumber, values } from "@piggo-gg/core"

type RowData = {
  row: HTMLDivElement
  name: string
  team: TeamNumber
  kda: KDAstring
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
      backgroundColor: "rgba(0, 0, 0, 0.3)",
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

            const health = player.components.controlling?.getCharacter(world)?.components.health
            const playerKDA: KDAstring = health?.data.kda || "0|0|0"

            // clean up stale rows
            const rowData = playerData[player.id]
            if (rowData) {
              if (rowData.kda !== playerKDA || rowData.name !== pc.data.name || rowData.team !== team.data.team) {
                rowData.row.parentElement?.removeChild(rowData.row)
                delete playerData[player.id]
              }
            }

            // add new row
            if (!playerData[player.id]) {
              const row = ScoreboardRow(pc.data.name, team.data.team, playerKDA, world.client?.player?.id === player.id)

              playerData[player.id] = {
                row, name: pc.data.name, team: team.data.team, kda: playerKDA
              }
            }
          }

          // sort team1
          team1.innerHTML = ""
          const team1Rows = sortByFrags(playerData, 1)
          for (const rowData of team1Rows) {
            team1.appendChild(rowData.row)
          }

          // sort team2
          team2.innerHTML = ""
          const team2Rows = sortByFrags(playerData, 2)
          for (const rowData of team2Rows) {
            team2.appendChild(rowData.row)
          }

          wrapper.style.visibility = world.client?.bufferDown.get("tab") ? "visible" : "hidden"
        }
      })
    }
  })

  return scoreboard
}

const sortByFrags = (data: Record<string, RowData>, teamNumber: TeamNumber) => {
  return values(data).filter(pd => pd.team === teamNumber).sort((a, b) => {
    const aKills = parseInt(a.kda.split("|")[0])
    const bKills = parseInt(b.kda.split("|")[0])
    return bKills - aKills
  })
}

const ScoreboardRow = (name: string, team: TeamNumber, kda: KDAstring, isClient: boolean) => HDiv({
  style: {
    position: "relative",
    marginTop: "6px",
    width: "100%",
    left: "50%",
    transform: "translate(-50%)",
    height: "28px",
    border: isClient ? "2px solid gold" : "2px solid white",
    backgroundColor: team === 1 ? "rgba(229, 159, 37, 0.4)" : "rgba(70, 95, 144, 0.4)"
  }
}, HText({
  style: {
    left: "8px",
    fontSize: "24px",
    lineHeight: "28px"
  },
  text: name
}),
  HText({
    style: {
      right: "8px",
      fontSize: "24px",
      lineHeight: "28px"
    },
    text: kda.replaceAll("|", " / ")
  })
)
