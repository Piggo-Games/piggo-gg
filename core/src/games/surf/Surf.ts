import {
  Entity, GameBuilder, HtmlText, Networked, NPC, ThreeSystem, SystemBuilder,
  canvasAppend
} from "@piggo-gg/core"
import { SurfRamp } from "../../ecs/entities/objects/Ramp"

// Lightweight surf prototype with a simple 3D ramp scene.
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
      renderer: "three",
      settings: {},
      state: {},
      systems: [
        ThreeSystem,
        SurfCameraSystem
      ],
      entities: [
        SurfRamp(),
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

const SurfCameraSystem = SystemBuilder({
  id: "SurfCameraSystem",
  init: (world) => {
    return {
      id: "SurfCameraSystem",
      query: [],
      priority: 1,
      onTick: () => {
        if (!world.three) return
        // Park the camera so the ramp is visible.
        world.three.camera.c.position.set(3.5, 2.5, 6)
        world.three.camera.c.lookAt(0, 0.5, 0)
      }
    }
  }
})
