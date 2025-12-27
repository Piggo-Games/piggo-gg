import { Background, EscapeMenu, GameBuilder, HtmlFpsText, PixiCameraSystem, PixiRenderSystem, ShadowSystem, Water2D } from "@piggo-gg/core"
import { Beach } from "../island/terrain/Beach"
import { Rocket } from "./entities/Rocket"
import { Launchpad } from "./entities/Launchpad"
import { Rail } from "./entities/Rail"

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
      PixiCameraSystem(),
      ShadowSystem
    ],
    entities: [
      Background({ move: 0.2, rays: true }),
      EscapeMenu(world),
      HtmlFpsText(),

      Beach({ width: 2000, height: 400, pos: { x: 0, y: 270 } }),
      Water2D({ pos: { x: 0, y: 90 } }),

      Launchpad(),
      Rail(),

      Rocket()
    ]
  })
}
