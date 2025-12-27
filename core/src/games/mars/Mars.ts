import { Background, EscapeMenu, GameBuilder, HtmlFpsText, PixiRenderSystem } from "@piggo-gg/core"

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
      PixiRenderSystem
    ],
    entities: [
      Background({ moving: true, rays: true }),
      EscapeMenu(world),
      HtmlFpsText()
    ]
  })
}
