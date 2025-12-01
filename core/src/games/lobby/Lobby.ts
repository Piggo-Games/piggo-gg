import {
  Actions, Background, Island, Entity, GameBuilder, getBrowser,
  HButton, HImg, HText, HtmlDiv, HtmlLagText, HtmlText,
  LobbiesMenu, Networked, NPC, piggoVersion, PixiRenderSystem,
  RefreshableDiv, Strike, styleButton, Volley, World
} from "@piggo-gg/core"

type LobbyState = {
  gameId: "volley" | "craft" | "strike" | "island"
}

export const Lobby: GameBuilder<LobbyState> = {
  id: "lobby",
  init: () => ({
    id: "lobby",
    renderer: "pixi",
    settings: {},
    state: {
      gameId: "island"
    },
    systems: [PixiRenderSystem],
    entities: [
      Background({ moving: true, rays: true }),
      GameLobby(),
      HtmlLagText()
    ],
    netcode: "delay"
  })
}

const GameButton = (game: GameBuilder, world: World) => {

  let rotation = 0

  return HButton({
    style: {
      width: "180px", height: "170px", borderRadius: "12px", fontSize: "24px", position: "relative",
      transition: "transform 0.8s ease, box-shadow 0.2s ease",
      border: "3px solid transparent",
      backgroundImage: "linear-gradient(black, black), linear-gradient(180deg, white, 90%, #aaaaaa)",
    },
    onClick: (button) => {
      button.style.transform = `translate(0%, 0%) rotateY(${rotation += 360}deg)`

      if (!world.client?.isLeader()) return

      world.actions.push(world.tick + 2, "gameLobby", { actionId: "selectGame", params: { gameId: game.id } })
      world.client?.sound.play({ name: "bubble" })
    },
    onHover: (button) => {
      button.style.boxShadow = "0 0 10px 4px white"
    },
    onHoverOut: (button) => {
      button.style.boxShadow = "none"
    }
  },
    HImg({
      src: `${game.id}-256.jpg`,
      style: { top: "50%", width: "176px", height: "166px", transform: "translate(-50%, -50%)" }
    }),
    HText({
      text: game.id,
      style: { fontSize: "24px", left: "50%", transform: "translate(-50%)", bottom: "-34px", fontWeight: "bold" }
    })
  )
}

const Profile = (world: World): RefreshableDiv => {

  let tick = 0
  let frame = -1
  let rotation = 0

  const ProfileFrame = (frame: number) => HImg({
    style: {
      width: "min(6.6vw, 110px)",
      borderRadius: "8px",
      imageRendering: "pixelated",
      pointerEvents: "auto",
      visibility: "hidden",
      transform: "translate(-50%, -62%)"
    },
    id: `f${frame}`,
    src: `f${frame}.png`
  })

  return {
    update: () => {
      tick += 1
      if (tick == 7) {
        frame = (frame + 1) % 4
        tick = 0
      }

      const f1 = document.getElementById("f1") as HTMLImageElement
      const f2 = document.getElementById("f2") as HTMLImageElement
      const f3 = document.getElementById("f3") as HTMLImageElement
      const f4 = document.getElementById("f4") as HTMLImageElement

      const frames = [f1, f2, f3, f4]

      frames.forEach((f, i) => {
        if (frame === -1) f.decode() // prevents flicker
        f.style.visibility = i === frame ? "visible" : "hidden"
      })

      const playerName = world.client?.playerName()
      if (playerName && playerName !== "noob") {
        const name = document.getElementById("profile-name") as HTMLDivElement
        if (name) name.innerText = playerName
      }
    },
    div: HButton({
      style: {
        top: "16px", left: "16px", width: "min(13.4vw, 200px)", aspectRatio: "20 / 17",
        transition: "transform 0.8s ease, box-shadow 0.2s ease"
      },
      onClick: (button) => {
        button.style.transform = `translate(0%, 0%) rotateY(${rotation += 360}deg)`
        world.client?.sound.play({ name: "bubble" })
      },
      onHover: (button) => {
        button.style.boxShadow = "0 0 10px 4px white"
      },
      onHoverOut: (button) => {
        button.style.boxShadow = "none"
      }
    },
      ProfileFrame(1),
      ProfileFrame(2),
      ProfileFrame(3),
      ProfileFrame(4),
      HText({
        id: "profile-name",
        text: "noob",
        style: {
          fontSize: "min(2vw, 28px)", color: "#ffc0cb", left: "50%", bottom: "6px", transform: "translate(-50%)"
        }
      })
    )
  }
}

const Version = () => HtmlText({
  text: `v${piggoVersion}`,
  style: {
    position: "fixed", left: "15px", bottom: "15px", fontSize: "16px", color: "white", opacity: "0.7",
    userSelect: "none", pointerEvents: "none"
  }
})

const PlayersOnline = (world: World): RefreshableDiv => ({
  div: HText({
    id: "playersOnline",
    style: {
      position: "fixed", right: "15px", top: "15px", fontSize: "18px", color: "white", opacity: "0.7",
      userSelect: "none", pointerEvents: "none"
    }
  }),
  update: () => {
    const div = document.getElementById("playersOnline")
    if (!div) return

    if (world.tick === 40 || world.tick % 200 === 0) world.client?.metaPlayers((response) => {
      div.textContent = `players online: ${response.online}`
    })
  }
})

const GameLobby = (): Entity => {

  const list: GameBuilder[] = [Strike, Island, Volley]

  let gameButtons: HTMLButtonElement[] = []

  let lobbiesMenu: RefreshableDiv | undefined = undefined
  let profile: RefreshableDiv | undefined = undefined
  let playersOnline: RefreshableDiv | undefined = undefined

  if (getBrowser() === "safari") {
    document.body.appendChild(HText({
      text: "please use Chrome or Firefox",
      style: {
        color: "red", bottom: "4%", left: "50%", transform: "translate(-50%)", fontSize: "24px"
      }
    }))
  }

  const gameLobby = Entity({
    id: "gameLobby",
    components: {
      networked: Networked(),
      actions: Actions({
        "selectGame": ({ world, params }) => {
          if (!params) return
          const state = world.game.state as LobbyState
          state.gameId = params.gameId
        }
      }),
      npc: NPC({
        behavior: (_, world) => {

          if (gameButtons.length === 0) {

            playersOnline = PlayersOnline(world)

            document.body.appendChild(Version())
            document.body.appendChild(playersOnline.div)

            profile = Profile(world)
            document.body.appendChild(profile.div)

            const shell = HtmlDiv({
              left: "50%",
              top: "calc(13.4vw + 20px)",
              transform: "translate(-50%)",
              display: "flex",
              flexDirection: "column"
            })

            const gameButtonsShell = HtmlDiv({
              position: "relative",
              display: "flex",
              gap: "20px",
              flexDirection: "row",
              transform: "translate(-50%)",
              left: "50%",
              border: "none"
            })
            shell.appendChild(gameButtonsShell)

            for (const g of list) {
              const gameButton = GameButton(g, world)
              gameButtonsShell.appendChild(gameButton)
              gameButtons.push(gameButton)
            }

            document.body.appendChild(shell)

            const lobbiesShell = HtmlDiv({
              transform: "translate(-50%)",
              left: "50%",
              width: "404px",
              height: "220px",
              marginTop: "40px",
              border: "none",
              position: "relative"
            })

            lobbiesMenu = LobbiesMenu(world)
            lobbiesShell.appendChild(lobbiesMenu.div)
            // shell.appendChild(lobbiesShell)
          }


          if (world.client?.discord && lobbiesMenu) {
            lobbiesMenu.div.style.display = "none"
          }

          if (world.client) {
            lobbiesMenu?.update()
            profile?.update()
            playersOnline?.update()
          }

          // make border green for selected game
          const state = world.game.state as LobbyState
          for (const button of gameButtons) {
            const selected = button.innerText === state.gameId
            button.style.outline = selected ? "2px solid #00dd88" : "none"
          }
        }
      })
    }
  })
  return gameLobby
}
