import {
  Background, Build, Entity, GameBuilder, getBrowser, HButton, HImg,
  HText, HtmlDiv, HtmlLagText, HtmlText, LobbiesMenu, Networked, NPC,
  piggoVersion, PixiRenderSystem, RefreshableDiv, Volley, Island, CSS,
  Mars, World, canvasAppend, HtmlFpsText, HDiv, MusicButton, Hoops
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
      Background({ move: 0.5, rays: true }),
      GameLobby(),
      HtmlLagText(),
      HtmlFpsText()
    ],
    netcode: "delay"
  })
}

const startGame = (game: GameBuilder, world: World, state: LobbyState): void => {
  if (!world.client?.isLeader()) return
  if (state.starting) return

  world.client?.sound.play({ name: "bubble" })
  world.actions.push(world.tick + 20, "world", { actionId: "game", params: { game: game.id } })
  state.starting = true
}

const GameButton = (game: GameBuilder, world: World) => {

  let rotation = 0
  let intent = false

  const state = world.game.state as LobbyState

  const inner = HButton({
    style: {
      width: "100%",
      height: "100%",
      borderRadius: "12px",
      top: "0px",
      left: "0px",
      transition: "transform 0.5s ease, box-shadow 0.2s ease",
      border: "3px solid transparent",
      backgroundImage: "linear-gradient(black, black), linear-gradient(180deg, white, 90%, #aaaaaa)"
    }
  },
    HImg({
      src: `${game.id}-256.jpg`,
      style: {
        top: "50%",
        width: "100%",
        height: "101%",
        transform: "translate(-50%, -50%)"
      }
    }),
    HText({
      text: game.id,
      style: {
        fontSize: "min(2.4vw, 22px)",
        left: "50%",
        transform: "translate(-50%)",
        bottom: "max(-4vw, -34px)",
        fontWeight: "bold"
      }
    })
  )

  return HButton({
    style: {
      width: "min(20vw, 180px)",
      height: "min(19.4vw, 170px)",
      borderRadius: "12px",
      fontSize: "24px",
      position: "relative",
      background: "none"
    },
    onClick: () => {
      intent = true
    },
    onRelease: () => {
      if (!intent) return

      inner.style.transform = `translate(0%, -16px) rotateY(${rotation += 360}deg)`
      startGame(game, world, state)
    },
    onHover: () => {
      if (state.starting) return

      inner.style.transform = "translate(0%, -16px)"
      inner.style.boxShadow = "0 0 10px 4px white"
    },
    onHoverOut: () => {
      if (state.starting) return
      inner.style.boxShadow = "none"
      inner.style.transform = "translate(0%, 0%)"
    }
  },
    inner
  )
}

const MobileGamePicker = (games: GameBuilder[], world: World, state: LobbyState): { shell: HTMLDivElement, playButton: HTMLButtonElement } => {
  let selectedIndex = 0
  let startX = 0
  let startY = 0
  let lastDx = 0
  let pointerActive = false
  let activePointerId: number | null = null
  let animating = false
  const swipeDistance = 100

  const cardWidth = "min(58vw, 260px)"
  const cardHeight = "min(54vw, 230px)"
  const sideWidth = "min(22vw, 90px)"
  const sideHeight = "min(20vw, 80px)"

  const buildCard = (size: "main" | "side") => {
    const image = HImg({
      src: `${games[0].id}-256.jpg`,
      style: {
        top: "50%",
        width: "100%",
        height: "101%",
        transform: "translate(-50%, -50%)"
      }
    })

    const label = size === "main" ? HText({
      text: games[0].id,
      style: {
        fontSize: "min(6vw, 28px)",
        left: "50%",
        transform: "translate(-50%)",
        bottom: "10px",
        fontWeight: "bold"
      }
    }) : undefined

    const inner = HButton({
      style: {
        width: "100%",
        height: "100%",
        borderRadius: "16px",
        top: "0px",
        left: "0px",
        transition: "transform 0.2s ease",
        border: "3px solid transparent",
        backgroundImage: "linear-gradient(black, black), linear-gradient(180deg, white, 90%, #aaaaaa)"
      }
    },
      image,
      label
    )

    const button = HButton({
      style: {
        width: size === "main" ? cardWidth : sideWidth,
        height: size === "main" ? cardHeight : sideHeight,
        borderRadius: "16px",
        fontSize: "24px",
        position: "relative",
        background: "none",
        pointerEvents: "none"
      }
    },
      inner
    )

    return { button, image, label, inner }
  }

  const prevCard = buildCard("side")
  const mainCard = buildCard("main")
  const nextCard = buildCard("side")

  mainCard.inner.style.transform = "scale(1) rotate(0deg)"

  const carouselTrack = HDiv({
    style: {
      position: "relative",
      display: "flex",
      alignItems: "center",
      gap: "10px",
      border: "none",
      pointerEvents: "auto",
      touchAction: "pan-y"
    }
  },
    prevCard.button,
    mainCard.button,
    nextCard.button
  )

  const setDragTransform = (dx: number) => {
    const clamped = Math.max(-swipeDistance, Math.min(swipeDistance, dx))
    const spin = clamped * 0.05
    const scale = 1 - Math.min(Math.abs(clamped) / swipeDistance, 1) * 0.05
    carouselTrack.style.transform = `translateX(${clamped}px)`
    mainCard.inner.style.transform = `scale(${scale}) rotate(${spin}deg)`
  }

  const setSelectedIndex = (nextIndex: number) => {
    const count = games.length
    selectedIndex = (nextIndex + count) % count
    const prevGame = games[(selectedIndex - 1 + count) % count]
    const game = games[selectedIndex]
    const nextGame = games[(selectedIndex + 1) % count]
    prevCard.image.src = `${prevGame.id}-256.jpg`
    mainCard.image.src = `${game.id}-256.jpg`
    nextCard.image.src = `${nextGame.id}-256.jpg`
    if (mainCard.label) mainCard.label.textContent = game.id
  }

  const animateSwipe = (direction: "next" | "prev") => {
    if (animating) return
    animating = true

    const offset = direction === "next" ? -swipeDistance : swipeDistance
    const spin = offset * 0.05
    carouselTrack.style.transition = "transform 0.2s ease"
    carouselTrack.style.transform = `translateX(${offset}px)`
    mainCard.inner.style.transition = "transform 0.2s ease"
    mainCard.inner.style.transform = `scale(0.95) rotate(${spin}deg)`

    window.setTimeout(() => {
      setSelectedIndex(direction === "next" ? selectedIndex + 1 : selectedIndex - 1)
      carouselTrack.style.transition = "transform 0.2s ease"
      carouselTrack.style.transform = "translateX(0px)"
      mainCard.inner.style.transition = "transform 0.2s ease"
      mainCard.inner.style.transform = "scale(1) rotate(0deg)"
      window.setTimeout(() => {
        animating = false
      }, 200)
    }, 200)
  }

  const onPointerDown = (event: PointerEvent) => {
    if (animating) return
    pointerActive = true
    activePointerId = event.pointerId
    startX = event.clientX
    startY = event.clientY
    lastDx = 0
    carouselTrack.style.transition = "none"
    mainCard.inner.style.transition = "none"
    carouselTrack.setPointerCapture(event.pointerId)
  }

  const onPointerUp = (event: PointerEvent) => {
    if (!pointerActive) return
    pointerActive = false
    if (activePointerId !== null) {
      if (carouselTrack.hasPointerCapture(activePointerId)) {
        carouselTrack.releasePointerCapture(activePointerId)
      }
      activePointerId = null
    }

    const dx = event.clientX - startX
    const dy = event.clientY - startY
    lastDx = dx
    if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy)) {
      carouselTrack.style.transition = "transform 0.2s ease"
      carouselTrack.style.transform = "translateX(0px)"
      mainCard.inner.style.transition = "transform 0.2s ease"
      mainCard.inner.style.transform = "scale(1) rotate(0deg)"
      return
    }

    animateSwipe(dx < 0 ? "next" : "prev")
  }

  const onPointerMove = (event: PointerEvent) => {
    if (!pointerActive || animating) return
    const dx = event.clientX - startX
    if (Math.abs(dx - lastDx) < 2) return
    lastDx = dx
    setDragTransform(dx)
  }

  const onPointerCancel = () => {
    pointerActive = false
    if (activePointerId !== null) {
      if (carouselTrack.hasPointerCapture(activePointerId)) {
        carouselTrack.releasePointerCapture(activePointerId)
      }
      activePointerId = null
    }
    carouselTrack.style.transition = "transform 0.2s ease"
    carouselTrack.style.transform = "translateX(0px)"
    mainCard.inner.style.transition = "transform 0.2s ease"
    mainCard.inner.style.transform = "scale(1) rotate(0deg)"
  }

  const arrowStyle: CSS = {
    width: "44px",
    height: "44px",
    fontSize: "30px",
    borderRadius: "999px",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    backgroundImage: "none",
    border: "2px solid #ffffff",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    textShadow: "none"
  }

  const leftArrow = HButton({
    text: "<",
    style: {
      ...arrowStyle,
      position: "absolute",
      left: "12px",
      top: "80%",
      transform: "translate(-50%, 0%)",
      zIndex: 2
    },
    onRelease: () => animateSwipe("prev")
  })

  const rightArrow = HButton({
    text: ">",
    style: {
      ...arrowStyle,
      position: "absolute",
      right: "12px",
      top: "80%",
      transform: "translate(50%, 0%)",
      zIndex: 2
    },
    onRelease: () => animateSwipe("next")
  })

  const carouselRow = HDiv({
    style: {
      position: "relative",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: "min(92vw, 360px)",
      border: "none",
      pointerEvents: "auto"
    }
  },
    carouselTrack,
    leftArrow,
    rightArrow
  )

  carouselTrack.addEventListener("pointerdown", onPointerDown)
  carouselTrack.addEventListener("pointermove", onPointerMove)
  carouselTrack.addEventListener("pointerup", onPointerUp)
  carouselTrack.addEventListener("pointercancel", onPointerCancel)

  setSelectedIndex(0)

  const playButton = HButton({
    text: "Play",
    style: {
      position: "relative",
      width: cardWidth,
      height: "56px",
      marginTop: "14px",
      backgroundColor: "#1f8f3a",
      backgroundImage: "linear-gradient(180deg, #7bff98, #1f8f3a)",
      border: "3px solid #baffc9",
      color: "#0d2b16",
      textShadow: "none",
      fontSize: "22px"
    },
    onRelease: () => {
      startGame(games[selectedIndex], world, state)
    }
  })

  const shell = HDiv({
    style: {
      position: "relative",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "12px",
      border: "none"
    }
  },
    carouselRow,
    playButton
  )

  return { shell, playButton }
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

  const list: GameBuilder[] = [Build, Volley, Hoops, Island, Mars]

  let gameButtons: HTMLButtonElement[] = []

  let lobbiesMenu: RefreshableDiv | undefined = undefined
  let profile: RefreshableDiv | undefined = undefined
  let music: RefreshableDiv | undefined = undefined
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

            canvasAppend(Version(), playersOnline.div)

            profile = Profile(world)
            music = MusicButton(world)

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
              music.div
            )

            canvasAppend(profileRow)

            const shell = HtmlDiv({
              left: "50%",
              top: "calc(13.4vw + 20px)",
              transform: "translate(-50%)",
              display: "flex",
              flexDirection: "column"
            })

            const isMobileClient = Boolean(world.client?.mobile)
            const state = world.game.state as LobbyState

            if (isMobileClient) {
              shell.style.top = "34vh"
              const mobilePicker = MobileGamePicker(list, world, state)
              shell.appendChild(mobilePicker.shell)
              gameButtons.push(mobilePicker.playButton)
            } else {
              const gameButtonsShell = HtmlDiv({
                position: "relative",
                display: "flex",
                gap: "20px",
                flexDirection: "row",
                transform: "translate(-50%)",
                left: "50%",
                border: "none",
                paddingTop: "1vh",
              })
              shell.appendChild(gameButtonsShell)

              for (const g of list) {
                const gameButton = GameButton(g, world)
                gameButtonsShell.appendChild(gameButton)
                gameButtons.push(gameButton)
              }
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
            music?.update()
            playersOnline?.update()
          }
        }
      })
    }
  })
  return gameLobby
}
