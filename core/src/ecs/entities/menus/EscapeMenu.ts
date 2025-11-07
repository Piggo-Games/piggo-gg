import {
  CSS, Entity, HButton, HImg, HtmlButton, HtmlDiv, LobbiesMenu,
  NPC, Position, SettingsMenu, SkinsMenu, World, styleButton
} from "@piggo-gg/core"

export const EscapeMenu = (world: World): Entity => {

  let init = false
  let activeMenu: "lobbies" | "skins" | "settings" = "lobbies"

  const bg = HtmlDiv({
    width: "100%", height: "100%", left: "0px", top: "0px", backgroundColor: "rgba(0, 0, 0, 0.4)"
  })

  const wrapper = HtmlDiv({
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: "404px",
    maxWidth: "94%",
    height: "70%",
    maxHeight: "460px",
    pointerEvents: "auto",
    border: "",
    display: "flex",
    flexDirection: "column",
    touchAction: "pan-y",
    visibility: "hidden"
  })

  let rotation = 0

  const artImage = HImg({
    id: "art-image",
    style: { top: "50%", width: "144px", height: "144px", transform: "translate(-50%, -50%)" },
    src: `${world.game.id}-256.jpg`,
    onClick: () => {
      rotation += 540
      art.style.transform = `translate(-50%) rotateY(${rotation}deg)`
    },
    onHover: () => {
      art.style.boxShadow = "0 0 10px 4px white"
    },
    onHoverOut: () => {
      art.style.boxShadow = "none"
    }
  })

  const art = HButton({
    style: {
      left: "50%",
      transform: "translate(-50%)",
      // marginBottom: "6px",
      width: "148px",
      height: "148px",
      borderRadius: "12px",
      position: "relative",
      transition: "transform 0.8s ease, box-shadow 0.2s ease",
      border: "3px solid transparent",
      backgroundImage: "linear-gradient(black, black), linear-gradient(180deg, white, 90%, #aaaaaa)",
    },
    onClick: (button) => {
      button.style.transform = `translate(-50%, 0%) rotateY(${rotation += 360}deg)`
    },
    onHover: (button) => {
      button.style.boxShadow = "0 0 10px 4px white"
    },
    onHoverOut: (button) => {
      button.style.boxShadow = "none"
    }
  },
    artImage
  )

  const menuButtonStyle: CSS = {
    width: "32.5%", position: "relative", top: "0px", height: "40px", pointerEvents: "auto"
  }

  const lobbiesButton = HtmlButton({
    text: "lobbies",
    style: menuButtonStyle,
    onClick: () => activeMenu = "lobbies"
  })

  const skinsButton = HtmlButton({
    text: "skins",
    style: menuButtonStyle,
    onClick: () => activeMenu = "skins"
  })

  const settingsButton = HtmlButton({
    text: "settings",
    style: menuButtonStyle,
    onClick: () => activeMenu = "settings"
  })

  const submenuButtons = HtmlDiv({
    position: "relative",
    width: "calc(100% + 4px)",
    display: "flex",
    left: "-2px",
    justifyContent: "space-between",
    border: "",
    marginTop: "14px"
  })

  const returnToHomescreen = HtmlButton({
    text: "return home",
    style: {
      position: "relative",
      transform: "translate(-50%)",
      marginTop: "16px",
      width: "200px",
      left: "50%",
      height: "40px",
      pointerEvents: "auto"
    },
    onClick: () => {
      if (!world.client?.isLeader()) return
      world.actions.push(world.tick + 1, "world", { actionId: "game", params: { game: "lobby" } })
    }
  })

  submenuButtons.appendChild(lobbiesButton)
  submenuButtons.appendChild(skinsButton)
  submenuButtons.appendChild(settingsButton)

  const lobbies = LobbiesMenu(world)
  const skins = SkinsMenu()
  const settings = SettingsMenu(world)

  const shell = HtmlDiv({
    position: "relative",
    width: "100%",
    top: "10px",
    flex: "1 1 auto",
    minHeight: 0,
    maxHeight: "300px",
    display: "flex",
    border: "none",
    flexDirection: "column",
    touchAction: "pan-y"
  })

  shell.appendChild(lobbies.div)
  shell.appendChild(skins.div)
  shell.appendChild(settings.div)

  wrapper.appendChild(art)
  // wrapper.appendChild(submenuButtons)
  // if (!world.client?.mobile) wrapper.appendChild(returnToHomescreen)
  wrapper.appendChild(shell)
  wrapper.appendChild(submenuButtons)
  // if (!world.client?.mobile) wrapper.appendChild(returnToHomescreen)

  const menu = Entity({
    id: "EscapeMenu",
    components: {
      position: Position({ x: 0, y: 0, z: 0 }),
      npc: NPC({
        behavior: (_, world) => {
          if (world.mode === "server") return

          if (!init) {
            world.three?.append(bg, wrapper)
            init = true
          }

          // overall visibility
          if (world.client) {
            const visible = world.client.menu
            bg.style.visibility = visible ? "visible" : "hidden"
            wrapper.style.visibility = visible ? "visible" : "hidden"

            if (!visible) return
          }

          // art.style.width = (world.client?.mobile && window.outerHeight < window.outerWidth) ? "0px" : "180px"
          // art.style.height = (world.client?.mobile && window.outerHeight < window.outerWidth) ? "0px" : "170px"
          // artImage.style.width = (world.client?.mobile && window.outerHeight < window.outerWidth) ? "0px" : "176px"

          // menu buttons
          styleButton(returnToHomescreen, world.client?.isLeader() ?? false, returnToHomescreen.matches(":hover"))
          styleButton(lobbiesButton, activeMenu !== "lobbies", lobbiesButton.matches(":hover"))
          styleButton(skinsButton, activeMenu !== "skins", skinsButton.matches(":hover"))
          styleButton(settingsButton, activeMenu !== "settings", settingsButton.matches(":hover"))

          // visibility of submenus
          lobbies.div.style.display = activeMenu === "lobbies" ? "flex" : "none"
          skins.div.style.display = activeMenu === "skins" ? "flex" : "none"
          settings.div.style.display = activeMenu === "settings" ? "flex" : "none"

          lobbies.update()
          skins.update()
          settings.update()
        }
      })
    }
  })
  return menu
}
