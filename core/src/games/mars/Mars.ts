import { Background, EscapeMenu, GameBuilder, HtmlFpsText, PixiCameraSystem, PixiRenderSystem } from "@piggo-gg/core"
import { Beach } from "../island/terrain/Beach"

export type MarsState = {
  money: number
}

export type MarsSettings = {}

export const Mars: GameBuilder<MarsState, MarsSettings> = {
  id: "mars",
  init: (world) => ({
    id: "mars",
    netcode: "delay",
    renderer: "pixi",
    settings: {},
    state: {
      money: 0
    },
    systems: [
      PixiRenderSystem,
      PixiCameraSystem()
    ],
    entities: [
      Background({ moving: true, rays: true }),
      EscapeMenu(world),
      HtmlFpsText(),

      Beach({ width: 2000, height: 400, pos: { x: 0, y: 250 } })
    ]
  })
}
