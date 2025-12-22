import { HButton, HDiv, HImg, RefreshableDiv, World } from "@piggo-gg/core"

export const MusicButton = (world: World): RefreshableDiv => {

  const setVisual = (button: HTMLElement) => {
    const enabled = world.client?.sound.musicPlaying()
    button.style.boxShadow = enabled ? "0 0 10px 2px #6cf" : "none"
    button.style.opacity = enabled ? "1" : "0.7"
  }

  const inner = HDiv({
    style: {
      position: "absolute",
      width: "100%",
      height: "100%",
      borderRadius: "10px",
      backgroundImage: "linear-gradient(black, black), linear-gradient(180deg, #ffffff, 85%, #8aa7ff)",
      top: "-2px",
      left: "-2px",
      border: "2px solid #ffffff",
      transition: "transform 0.3s ease, box-shadow 0.2s ease"
    }
  },
    HImg({
      src: "music.svg",
      style: {
        width: "22px",
        height: "22px",
        left: "48%",
        top: "50%",
        transform: "translate(-50%, -50%)"
      }
    })
  )

  const button = HButton({
    style: {
      position: "relative",
      width: "36px",
      height: "36px",
      borderRadius: "10px",
      justifyContent: "center",
      background: "none"
    },
    onClick: () => {
      const enabled = world.client?.sound.musicPlaying()
      if (!enabled) {
        world.client?.sound.stopMusic()
        world.client?.sound.play({ name: "track1", fadeIn: 0 })
      } else {
        world.client?.sound.stopMusic()
      }
    },
    onHover: () => inner.style.transform = "translate(0, -4px)",
    onHoverOut: () => inner.style.transform = "translate(0, 0)"
  },
    inner
  )

  return {
    div: button,
    update: () => setVisual(inner)
  }
}
