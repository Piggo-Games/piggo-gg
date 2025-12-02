import {
  Entity, GameBuilder, HtmlText, Networked, NPC, ThreeSystem, SystemBuilder,
  canvasAppend, Position
} from "@piggo-gg/core"
import { SurfRamp } from "../../ecs/entities/objects/Ramp"
import { SurfPhysicsSystem } from "./SurfPhysicsSystem"
import { SurfPilot } from "./SurfPilot"

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
        SurfPhysicsSystem,
        SurfCameraSystem
      ],
      entities: [
        SurfPilot(),
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
        const pilot = world.entity("surf-pilot")
        const position = pilot?.components.position as Position | undefined
        if (!position || !world.client) return

        const { localAim } = world.client.controls
        const forward = {
          x: -Math.sin(localAim.x) * Math.cos(localAim.y),
          y: -Math.cos(localAim.x) * Math.cos(localAim.y),
          z: Math.sin(localAim.y)
        }

        const eye = {
          x: position.data.x,
          y: position.data.y,
          z: position.data.z + 0.8
        }

        world.three.camera.c.position.set(eye.x, eye.z, eye.y)
        world.three.camera.c.lookAt(
          eye.x + forward.x,
          eye.z + forward.z,
          eye.y + forward.y
        )
      }
    }
  }
})
