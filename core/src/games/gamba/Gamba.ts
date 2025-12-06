import {
  Actions, Background, Character, Collider, Cursor, Entity, EscapeMenu,
  GameBuilder, HUDSystem, HUDSystemProps, HtmlChat, HtmlFpsText, HtmlLagText,
  Input, LineWall, Move, Networked, PhysicsSystem, PixiCameraSystem,
  PixiRenderSystem, PixiSkins, Player, Position, Renderable, Shadow,
  SpawnSystem, SwitchTeam, SystemBuilder, Team, WASDInputMap, pixiGraphics,
  pixiText, screenWH, VolleyCharacterAnimations, VolleyCharacterDynamic,
  InventorySystem,
  Inventory,
  Sword,
  ItemSystem,
  Point,
  Debug
} from "@piggo-gg/core"

const arenaWidth = 360
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
      SpawnSystem({ spawner: GambaPlayer, pos: { x: 0, y: 0, z: 0 } }),
      GambaSystem,
      PixiRenderSystem,
      HUDSystem(controls),
      PixiCameraSystem(() => ({ x: 0, y: 0, z: 0 })),
      InventorySystem,
      ItemSystem
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

    if (world.pixi) {
      // world.pixi.camera.focus = { x: 0, y: 0, z: 0 }
    }

    let lastScale = 0

    const updateScale = () => {
      if (!world.pixi) return

      const { w } = screenWH()
      const targetScale = Math.min(3.4, Math.max(2, w / (arenaWidth * 0.9)))

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
        updateScale()
      }
    }
  }
})

const Arena = (): Entity[] => {
  return [
    ArenaFloor(),
    CenterMark(),
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
        renderable.setBevel({ lightAlpha: 0.1, shadowAlpha: 0.18 })
        renderable.c = pixiGraphics()
          .roundRect(-arenaWidth / 2, -arenaHeight / 2, arenaWidth, arenaHeight, 18)
          .fill({ color: 0x0b2434, alpha: 0.92 })
        // .stroke({ color: 0xffffff, alpha: 0.16, width: 3 })
      }
    })
  }
})

const ArenaWalls = (): Entity[] => {
  const halfW = arenaWidth / 2
  const halfH = arenaHeight / 2

  return [
    LineWall({ id: "gamba-wall-top", points: [-halfW, -halfH, halfW, -halfH], visible: true, strokeAlpha: 0.3 }),
    LineWall({ id: "gamba-wall-bottom", points: [-halfW, halfH, halfW, halfH], visible: true, strokeAlpha: 0.3 }),
    LineWall({ id: "gamba-wall-left", points: [-halfW, -halfH, -halfW, halfH], visible: true, strokeAlpha: 0.3 }),
    LineWall({ id: "gamba-wall-right", points: [halfW, -halfH, halfW, halfH], visible: true, strokeAlpha: 0.3 })
  ]
}

const CenterMark = () => Entity({
  id: "gamba-center",
  components: {
    position: Position(),
    networked: Networked(),
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

// const ArenaLabel = () => Entity({
//   id: "gamba-label",
//   components: {
//     position: Position({ x: 0, y: -arenaHeight / 2 - 16 }),
//     networked: Networked(),
//     renderable: Renderable({
//       zIndex: 4,
//       setContainer: async () => pixiText({
//         text: "Gamba (WIP)",
//         anchor: { x: 0.5, y: 0.5 },
//         style: { fontSize: 18, fill: 0xffffff, dropShadow: true }
//       })
//     })
//   }
// })

const GambaPlayer = (player: Player): Character => {
  const skin = player.components.team.data.team === 1 ? "dude-blue" : "dude-red"

  return Character({
    id: `gamba-${player.id}`,
    components: {
      debug: Debug(),
      position: Position({
        x: player.components.team.data.team === 1 ? -80 : 80,
        y: 0,
        z: 0,
        speed: 120,
        gravity: 0,
        velocityResets: 1
      }),
      collider: Collider({ shape: "ball", radius: 6, group: "notself" }),
      networked: Networked(),
      team: Team(player.components.team.data.team),
      inventory: Inventory([Sword]),
      shadow: Shadow(5),
      input: Input({
        press: {
          ...WASDInputMap.press,
          "t": ({ hold }) => {
            if (hold) return
            return { actionId: "SwitchTeam" }
          },
          "g": ({ world, hold }) => {
            if (hold === 5) {
              world.debug = !world.debug
            }
          }
        },
        release: {
          "escape": ({ client }) => {
            client.menu = !client.menu
          },
          "mb1": ({ client, target }) => {
            if (target !== "canvas") return
            if (client.menu) client.menu = false
          }
        }
      }),
      actions: Actions({
        move: Move,
        point: Point,
        SwitchTeam
      }),
      renderable: Renderable({
        anchor: { x: 0.55, y: 0.9 },
        scale: 1.2,
        zIndex: 4,
        interpolate: true,
        scaleMode: "nearest",
        skin,
        setup: async (renderable) => {
          const desiredSkin = renderable.data.desiredSkin ?? skin
          await PixiSkins[desiredSkin](renderable)
        },
        animationSelect: VolleyCharacterAnimations,
        onTick: VolleyCharacterDynamic
      })
    }
  })
}

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
      label: "switch team",
      buttons: [["t"]]
    },
    {
      label: "menu",
      buttons: [["esc"], ["click canvas"]]
    }
  ]
}
