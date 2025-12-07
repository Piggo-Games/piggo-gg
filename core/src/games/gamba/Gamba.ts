import {
  Background, Cursor, Entity, EscapeMenu, GameBuilder, HUDSystem, HUDSystemProps,
  HtmlChat, HtmlFpsText, HtmlLagText, InventorySystem, ItemSystem, LineWall,
  NametagSystem, PhysicsSystem, PixiCameraSystem, PixiDebugSystem,
  PixiRenderSystem, ShadowSystem, SpawnSystem, SystemBuilder, screenWH
} from "@piggo-gg/core"
import { Gary } from "./Gary"
import { Sand } from "./Sand"
import { BlueGuy } from "./enemies/BlueGuy"

const arenaWidth = 520
const arenaHeight = 210

export type GambaState = {
  round: number
}

export type GambaSettings = {
  showControls: boolean
}

export const Gamba: GameBuilder<GambaState, GambaSettings> = {
  id: "gamba",
  init: (world) => ({
    id: "gamba",
    netcode: "rollback",
    renderer: "pixi",
    settings: {
      showControls: true
    },
    state: {
      round: 1
    },
    systems: [
      PhysicsSystem("local"),
      PhysicsSystem("global"),
      SpawnSystem({ spawner: Gary, pos: { x: 0, y: 0, z: 0 } }),
      GambaSystem,
      PixiRenderSystem,
      HUDSystem(controls),
      PixiCameraSystem(),
      PixiDebugSystem,
      InventorySystem,
      ItemSystem,
      ShadowSystem,
      NametagSystem
    ],
    entities: [
      Background({ rays: true }),
      Wall(),
      Cursor(),
      EscapeMenu(world),
      HtmlChat(),
      HtmlLagText(),
      HtmlFpsText(),
      Sand(),
      BlueGuy()
      // Water2D()
    ]
  })
}

const GambaSystem = SystemBuilder({
  id: "GambaSystem",
  init: (world) => {

    let lastScale = 0

    const updateScale = () => {
      if (!world.pixi) return

      const { w } = screenWH()
      const targetScale = Math.min(3.4, Math.max(2, w / (arenaWidth * 1.05)))

      if (Math.abs(targetScale - lastScale) > 0.02) {
        world.pixi.camera.scaleTo(targetScale)
        lastScale = targetScale
      }
    }

    updateScale()

    return {
      id: "GambaSystem",
      query: [],
      priority: 6,
      onTick: () => {
        // updateScale()

        // const pc = world.client?.character()
        // console.log(pc?.components.position.xyz())
      }
    }
  }
})

const Wall = (): Entity => {
  const halfW = arenaWidth / 2
  const halfH = arenaHeight / 2

  const offset = 60

  return LineWall({
    id: "all-walls", points: [
      -halfW + offset, -halfH,
      halfW - offset, -halfH,
      halfW, halfH,
      -halfW, halfH,
      -halfW + offset, -halfH
    ],
    visible: false,
    group: "all"
  })
}

const controls: HUDSystemProps = {
  direction: "row",
  clusters: [
    {
      label: "roll",
      buttons: [["mb1"]]
    },
    {
      label: "move",
      buttons: [
        ["A", "S", "D"],
        ["W"]
      ]
    },
    {
      label: "menu",
      buttons: [["esc"]]
    }
  ]
}
