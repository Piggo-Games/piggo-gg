import {
  Background, Cursor, Debug, Entity, EscapeMenu, GameBuilder, HUDSystem, HUDSystemProps,
  HtmlChat, HtmlFpsText, HtmlLagText, InventorySystem, ItemSystem, LineWall, NametagSystem,
  Networked, PhysicsSystem, PixiCameraSystem, PixiDebugSystem, PixiRenderSystem, Position,
  Renderable, ShadowSystem, SpawnSystem, SystemBuilder, pixiGraphics, screenWH
} from "@piggo-gg/core"
import { Gary } from "./Gary"

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
      // PixiCameraSystem(({ x, y }) => ({ x, y, z: 0 })),
      PixiDebugSystem,
      InventorySystem,
      ItemSystem,
      ShadowSystem,
      NametagSystem
    ],
    entities: [
      Background({ rays: true }),
      ...Arena(),
      Cursor(),
      EscapeMenu(world),
      HtmlChat(),
      HtmlLagText(),
      HtmlFpsText()
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

const Arena = (): Entity[] => {
  return [
    ArenaFloor(),
    // CenterMark(),
    // ArenaLabel(),
    ...ArenaWalls()
  ]
}

const ArenaFloor = () => Entity({
  id: "gamba-floor",
  components: {
    position: Position(),
    networked: Networked(),
    renderable: Renderable({
      zIndex: 2,
      setup: async (renderable) => {
        // renderable.setBevel({ lightAlpha: 0.1, shadowAlpha: 0.18 })
        // renderable.c = pixiGraphics()
        //   .roundRect(-arenaWidth / 2, -arenaHeight / 2, arenaWidth, arenaHeight, 18)
        //   .fill({ color: 0x0b2434, alpha: 0.92 })
        // .stroke({ color: 0xffffff, alpha: 0.16, width: 3 })
      }
    })
  }
})

const ArenaWalls = (): Entity[] => {
  const halfW = arenaWidth / 2
  const halfH = arenaHeight / 2

  const offset = 60

  return [
    LineWall({
      id: "all-walls", points: [
        -halfW + offset, -halfH,
        halfW - offset, -halfH,
        halfW, halfH,
        -halfW, halfH,
        -halfW + offset, -halfH
      ],
      visible: true,
      strokeAlpha: 0,
      fill: 0x7B3F00,
      group: "1",
      // texture: "wood.json"
    })
  ]
}

const CenterMark = () => Entity({
  id: "gamba-center",
  components: {
    position: Position(),
    debug: Debug(),
    renderable: Renderable({
      zIndex: 3,
      setup: async (renderable) => {
        renderable.c = pixiGraphics()
          .circle(0, 0, 8)
          .fill({ color: 0xffb347, alpha: 0.8 })
          .stroke({ color: 0xffffff, alpha: 0.9, width: 2 })
      }
    })
  }
})

const controls: HUDSystemProps = {
  clusters: [
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
