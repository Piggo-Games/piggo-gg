import {
  CraftState, Entity, HtmlDiv, HtmlText, NPC,
  Player, Position, RefreshableDiv, World
} from "@piggo-gg/core"

export const CraftScoreboard = (): Entity => {

  let init = false

  let numPlayers = 0
  let phase = "warmup"
  const playerPoints: Record<string, number> = {}

  const playerRows: Record<string, RefreshableDiv> = {}

  const container = HtmlDiv({
    top: "10px",
    right: "10px",
    width: "auto",
    minWidth: "180px",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    marginTop: "env(safe-area-inset-top)",
    marginRight: "env(safe-area-inset-right)",
  })

  const title = () => HtmlText({
    text: phase,
    style: {
      position: "relative",
      margin: "0 auto",
      width: "60%",
      top: "4px",
      textAlign: "center",
      marginBottom: "14px",
      borderBottom: "2px dotted #ffffff"
    }
  })

  const scoreboard = Entity({
    id: "CraftScoreboard",
    components: {
      position: Position(),
      npc: NPC({
        behavior: (_, world) => {
          if (world.mode === "server") return

          if (!world.client?.net.synced || (world.client.mobile && world.client?.menu)) {
            container.style.visibility = "hidden"
            return
          }

          container.style.visibility = "visible"

          if (!init) {
            init = true
            world.three?.append(container)
          }

          const state = world.state<CraftState>()
          const players = world.players()

          let pointsChanged = false
          for (const player of players) {
            if (player.components.pc.data.points !== playerPoints[player.id]) {
              pointsChanged = true
              break
            }
          }

          if (pointsChanged || numPlayers !== players.length || phase !== state.phase) {
            numPlayers = players.length
            phase = state.phase === "play" ? `round ${state.round}` : state.phase

            container.innerHTML = ""
            container.appendChild(title())

            players.sort((a, b) => (b.components.pc.data.points - a.components.pc.data.points))
            for (const player of players) {
              const playerRow = PlayerRow(player, world)

              container.appendChild(playerRow.div)

              playerRows[player.id] = playerRow
            }
          }

          for (const player of players) {
            playerRows[player.id]?.update()
            playerPoints[player.id] = player.components.pc.data.points
          }
        }
      })
    }
  })

  return scoreboard
}

const PlayerRow = (player: Player, world: World): RefreshableDiv => {
  const div = HtmlDiv({
    position: "relative",
    height: "30px",
    width: "auto",
    justifyContent: "space-between",
    display: "flex",
    border: ""
  })

  const nameText = HtmlText({
    text: player.components.pc.data.name,
    style: {
      flex: 1,
      fontSize: "18px",
      position: "relative",
      marginLeft: "10px"
    }
  })

  const status = (): string => {
    const state = world.state<CraftState>()
    if (state.phase === "warmup") {
      return player.components.pc.data.ready ? "🟢" : "🔴"
    } else {
      const character = player.components.controlling.getCharacter(world)

      const bird = character?.components.position.data.flying ? "🦅️" : "🐤"
      return `${bird} (${player.components.pc.data.points})`
    }
  }

  const statusText = HtmlText({
    text: status(),
    style: {
      fontSize: "16px",
      position: "relative",
      marginRight: "10px",
      marginLeft: "10px"
    }
  })

  div.appendChild(nameText)
  div.appendChild(statusText)

  return {
    div,
    update: () => {
      nameText.textContent = player.components.pc.data.name
      statusText.textContent = status()
    }
  }
}
