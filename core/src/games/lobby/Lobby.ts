import {
  Background, Island, Entity, GameBuilder, getBrowser, HButton, HImg, HText,
  HtmlDiv, HtmlLagText, HtmlText, LobbiesMenu, Networked, NPC, piggoVersion,
  PixiRenderSystem, RefreshableDiv, Strike, Volley, World, canvasAppend, HtmlFpsText,
  HDiv
} from "@piggo-gg/core"

type LobbyState = {
  starting: boolean
}

export const Lobby: GameBuilder<LobbyState> = {
  id: "lobby",
  init: () => ({
    id: "lobby",
    renderer: "pixi",
    settings: {},
    state: {
      starting: false
    },
    systems: [PixiRenderSystem],
    entities: [
      Background({ moving: true, rays: true }),
      GameLobby(),
      HtmlLagText(),
      HtmlFpsText()
    ],
    netcode: "delay"
  })
}

const GameButton = (game: GameBuilder, world: World) => {

  let rotation = 0

  const state = world.game.state as LobbyState

  return HButton({
    style: {
      width: "180px", height: "170px", borderRadius: "12px", fontSize: "24px", position: "relative",
      transition: "transform 0.5s ease, box-shadow 0.2s ease",
      border: "3px solid transparent",
      backgroundImage: "linear-gradient(black, black), linear-gradient(180deg, white, 90%, #aaaaaa)",
    },
    onClick: (button) => {
      button.style.transform = `translate(0%, -16px) rotateY(${rotation += 360}deg)`

      if (!world.client?.isLeader()) return
      if (state.starting) return

      world.client?.sound.play({ name: "bubble" })
      world.actions.push(world.tick + 20, "world", { actionId: "game", params: { game: game.id } })
      state.starting = true
    },
    onHover: (button) => {
      if (state.starting) return

      button.style.transform = "translate(0%, -16px)"
      button.style.boxShadow = "0 0 10px 4px white"
    },
    onHoverOut: (button) => {
      if (state.starting) return
      button.style.boxShadow = "none"

      button.style.transform = "translate(0%, 0%)"

      button.style.width = "180px"
      button.style.height = "170px"
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
      width: "min(6.6vw, 100px)",
      borderRadius: "12px",
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
        position: "relative",
        width: "min(13.4vw, 200px)",
        aspectRatio: "20 / 17",
        borderRadius: "12px",
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

const MusicToggle = (world: World): RefreshableDiv => {
  // let enabled = false

  const setVisual = (button: HTMLButtonElement) => {
    const enabled = world.client?.sound.music.state === "play"
    button.style.boxShadow = enabled ? "0 0 10px 2px #6cf" : "none"
    button.style.opacity = enabled ? "1" : "0.7"
  }

  const button = HButton({
    style: {
      position: "relative",
      width: "36px",
      height: "36px",
      borderRadius: "10px",
      display: "flex",
      justifyContent: "center",
      backgroundImage: "linear-gradient(black, black), linear-gradient(180deg, #ffffff, 85%, #8aa7ff)",
      border: "2px solid #ffffff",
      transition: "transform 0.3s ease, box-shadow 0.2s ease"
    },
    onClick: () => {
      const enabled = world.client?.sound.music.state !== "play"
      if (enabled) {
        world.client?.sound.stopMusic()
        const played = world.client?.sound.play({ name: "track1", fadeIn: 0 })
        if (played) world.client!.sound.music.state = "play"
      } else {
        world.client?.sound.stopMusic()
        if (world.client) world.client.sound.music.state = "stop"
      }
    },
    onHover: (btn) => btn.style.transform = "translate(0, -4px)",
    onHoverOut: (btn) => btn.style.transform = "translate(0, 0)"
  },
    HImg({
      src: "music.svg",
      style: {
        width: "22px",
        height: "22px",
        left: "50%",
        top: "50%",
        transform: "translate(-50%, -50%)",
        transition: "transform 0.5s ease, box-shadow 0.2s ease"
      }
    })
  )

  return {
    div: button,
    update: () => setVisual(button)
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
      position: "fixed", right: "15px", bottom: "15px", fontSize: "18px", color: "white", opacity: "0.7",
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
  let musicToggle: RefreshableDiv | undefined = undefined
  let playersOnline: RefreshableDiv | undefined = undefined

  if (getBrowser() === "safari") {
    canvasAppend(HText({
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
      npc: NPC({
        behavior: (_, world) => {

          if (gameButtons.length === 0) {

            playersOnline = PlayersOnline(world)

            canvasAppend(Version())
            canvasAppend(playersOnline.div)

            profile = Profile(world)
            musicToggle = MusicToggle(world)

            const profileRow = HDiv({
              style: {
                position: "fixed",
                top: "16px",
                left: "16px",
                display: "flex",
                gap: "12px",
                alignItems: "flex-start",
              }
            },
              profile.div,
              musicToggle.div
            )

            canvasAppend(profileRow)

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

            canvasAppend(shell)

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
          }


          if (world.client?.discord && lobbiesMenu) {
            lobbiesMenu.div.style.display = "none"
          }

          if (world.client) {
            lobbiesMenu?.update()
            profile?.update()
            musicToggle?.update()
            playersOnline?.update()
          }
        }
      })
    }
  })
  return gameLobby
}
