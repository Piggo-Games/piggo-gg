import {
  Actions, Background, Build, Entity, GameBuilder, getBrowser, HButton,
  HImg, HText, HtmlDiv, HtmlLagText, HtmlText, LobbiesMenu, Networked,
  NPC, piggoVersion, pixiGraphics, PixiRenderSystem, pixiText,
  Position, RefreshableDiv, Renderable, Strike, styleButton, Volley, World
} from "@piggo-gg/core"

type LobbyState = {
  gameId: "volley" | "craft" | "strike" | "build"
}

export const Lobby: GameBuilder = {
  id: "lobby",
  init: () => ({
    id: "lobby",
    renderer: "pixi",
    settings: {},
    state: {
      gameId: "build"
    },
    systems: [PixiRenderSystem],
    entities: [
      Background({ moving: true, rays: true }),
      GameLobby(),
      HtmlLagText()

      // SignupCTA()
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

const PlayButton = (world: World) => {
  const button = HButton({
    text: "Play",
    style: {
      position: "relative", left: "50%", width: "300px", height: "42px", transform: "translate(-50%)",

      marginTop: "80px",
      fontSize: "26px",
      textShadow: "none",

      border: "2px solid transparent",
      borderRadius: "6px",
      backgroundImage: "linear-gradient(black, black), linear-gradient(180deg, white, 90%, #999999)",
      backgroundOrigin: "border-box",
      backgroundClip: "content-box, border-box"
    },
    onClick: () => {
      if (!world.client?.isLeader()) return

      const state = world.state<LobbyState>()
      if (["craft", "strike", "build"].includes(state.gameId)) world.client?.pointerLock()

      world.actions.push(world.tick + 1, "world", { actionId: "game", params: { game: state.gameId } })
      world.actions.push(world.tick + 2, "world", { actionId: "game", params: { game: state.gameId } })

      world.client?.sound.play({ name: "bubble" })
    }
  })

  return button
}

const Profile = (world: World): RefreshableDiv => {

  let tick = 0
  let frame = -1
  let rotation = 0

  const ProfileFrame = (frame: number) => HImg({
    style: {
      width: "94px", borderRadius: "8px", imageRendering: "pixelated", pointerEvents: "auto", visibility: "hidden", transform: "translate(-50%, -62%)"
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
        top: "16px", left: "16px", width: "200px", height: "170px",
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
          fontSize: "28px", color: "#ffc0cb", left: "50%", top: "120px", transform: "translate(-50%)"
        }
      })
    )
  }
}

const SignupCTA = () => Entity<Position | Renderable>({
  id: "signupCTA",
  components: {
    position: Position({ x: 0, y: 0, screenFixed: true }),
    renderable: Renderable({
      zIndex: 10,
      interactiveChildren: true,
      visible: false,
      onTick: ({ world, renderable }) => {
        if (!world.client) return
        renderable.visible = !world.client.token
      },
      setup: async (r) => {
        const text = pixiText({
          text: "^\nSign In for\na cool skin!",
          anchor: { x: 0.5, y: 0.9 },
          style: { align: "center", fontSize: 18, fontWeight: "bold" },
          pos: { x: 90, y: 65 }
        })

        const outline = pixiGraphics()
          .roundRect(10, 10, 160, 70, 10)
          .fill({ color: 0x000000, alpha: 0.9 })
          .stroke({ color: 0x00ffff, alpha: 1, width: 2 })

        r.c.addChild(outline, text)

        r.setBevel({ rotation: 90, lightAlpha: 0.8, shadowAlpha: 0.4 })
      }
    })
  }
})

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

  const list: GameBuilder[] = [Strike, Build, Volley]

  let gameButtons: HTMLButtonElement[] = []

  let playButton: HTMLButtonElement | undefined = undefined
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
              top: "14%",
              transform: "translate(-50%)",
              display: "flex",
              border: "none",
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

            playButton = PlayButton(world)
            shell.appendChild(playButton)

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

          if (playButton) styleButton(playButton, world.client?.isLeader() ?? false, playButton.matches(":hover"))

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
