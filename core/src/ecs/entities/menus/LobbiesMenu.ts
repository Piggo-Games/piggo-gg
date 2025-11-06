import {
  entries, HtmlButton, HtmlDiv, HtmlText, keys,
  RefreshableDiv, styleButton, World
} from "@piggo-gg/core"

export const LobbiesMenu = (world: World): RefreshableDiv => {
  const client = world.client!

  let polled = -60

  const lobbies = HtmlDiv({
    top: "-3px",
    left: "50%",
    width: "100%",
    height: "100%",
    // minHeight: "300px",
    transform: "translate(-50%)",
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    pointerEvents: "auto",
    position: "relative",
    display: "flex",
    flexDirection: "column",
    border: "2px solid white"
  })

  const lobbyList = HtmlDiv({
    width: "94%",
    flex: "1 1 auto",
    left: "50%",
    top: "10px",
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    border: "2px solid #bbbbbb",
    overflow: "scroll",
    transform: "translate(-50%)",
    display: "flex",
    flexDirection: "column",
    position: "relative"
  })

  const buttonsDiv = HtmlDiv({
    position: "relative",
    width: "100%",
    display: "flex",
    justifyContent: "space-between",
    border: "",
    paddingBottom: "30px"
  })

  const createLobby = HtmlButton({
    text: "Create Lobby",
    style: {
      transform: "translate(0%, 50%)",
      position: "relative",
      left: "10px",
      height: "40px",
      width: "46%"
    },
    onClick: () => {
      if (client.net.lobbyId) return

      client.lobbyCreate(world.game.id, ({ lobbyId }) => {
        client.net.lobbyId = lobbyId
        polled = world.tick - 70
      })
    }
  })

  const leaveLobby = HtmlButton({
    text: "Leave Lobby",
    style: {
      transform: "translate(0%, 50%)",
      position: "relative",
      right: "10px",
      height: "40px",
      width: "46%"
    },
    onClick: () => {
      if (!client.net.lobbyId) return

      client.lobbyLeave()

      polled = world.tick - 70
      client.net.lobbyId = undefined
    }
  })

  buttonsDiv.appendChild(createLobby)
  buttonsDiv.appendChild(leaveLobby)

  lobbies.appendChild(lobbyList)
  lobbies.appendChild(buttonsDiv)

  return {
    div: lobbies,
    update: () => {

      styleButton(createLobby, Boolean(!client.net.lobbyId && client.net.connected), createLobby.matches(":hover"))
      styleButton(leaveLobby, Boolean(client.net.lobbyId), leaveLobby.matches(":hover"))

      if (world.tick - 80 > polled) {
        polled = world.tick
        client.lobbyList((response) => {
          lobbyList.innerHTML = ""

          for (const [id, meta] of entries(response.lobbies)) {
            const lobby = HtmlText({
              text: `(${meta.players}) ${meta.creator} - ${meta.game}`, // [${id.slice(-3)}]
              style: {
                width: "75%",
                height: "36px",
                left: "5px",
                fontSize: "16px",
                lineHeight: "36px",
                textAlign: "center",
                backgroundColor: "rgba(0, 0, 0, 0.4)",
                border: meta.id === client.net.lobbyId ? "2px solid #aaffaa" : "2px solid #aaffff"
              }
            })

            const button = HtmlButton({
              text: "Join",
              onHover: () => {
                styleButton(button, meta.id !== client.net.lobbyId, true)
              },
              onHoverOut: () => {
                styleButton(button, meta.id !== client.net.lobbyId, false)
              },
              onClick: () => {
                client.lobbyJoin(meta.id, () => {
                  client.net.lobbyId = meta.id
                  polled = world.tick - 70
                })
              },
              style: {
                width: "20%",
                height: "40px",
                fontSize: "16px",
                right: "5px",
                position: "relative",
                float: "right"
              }
            })
            styleButton(button, meta.id !== client.net.lobbyId, false)

            const lobbyWrapper = HtmlDiv({
              position: "relative",
              marginTop: "5px",
              border: ""
            })

            lobbyWrapper.appendChild(lobby)
            lobbyWrapper.appendChild(button)

            lobbyList.appendChild(lobbyWrapper)
          }

          if (keys(response.lobbies).length === 0) {
            client.net.lobbyId = undefined
          }
        })
      }
    }
  }
}
