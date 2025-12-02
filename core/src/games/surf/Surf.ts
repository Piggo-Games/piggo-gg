import {
  Background, Entity, GameBuilder, HtmlText, Networked, NPC, PixiRenderSystem,
  canvasAppend
} from "@piggo-gg/core"

// Lightweight surf prototype that reuses the Pixi renderer with a simple banner.
export const Surf: GameBuilder = {
  id: "surf",
  init: () => {

    let banner: HTMLDivElement | undefined

    const SurfBanner = () => {
      if (banner) return
      banner = HtmlText({
        text: "Surf — ride the waves soon!",
        style: {
          position: "fixed",
          top: "12%",
          left: "50%",
          transform: "translate(-50%)",
          fontSize: "28px",
          color: "#e0f7ff",
          // textShadow: "0 0 10px rgba(0,0,0,0.6)",
          userSelect: "none"
        }
      })
      canvasAppend(banner)
    }

    return {
      id: "surf",
      renderer: "pixi",
      settings: {},
      state: {},
      systems: [PixiRenderSystem],
      entities: [
        Background({ moving: true, rays: true }),
        Entity({
          id: "surf-banner",
          components: {
            networked: Networked(),
            npc: NPC({
              behavior: () => SurfBanner()
            })
          }
        })
      ],
      netcode: "delay"
    }
  }
}
