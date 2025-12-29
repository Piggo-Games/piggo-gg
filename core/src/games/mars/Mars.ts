import { Background, EscapeMenu, GameBuilder, HtmlFpsText, PixiCameraSystem, PixiRenderSystem, ShadowSystem, SystemBuilder, Water2D } from "@piggo-gg/core"
import { Beach } from "../island/terrain/Beach"
import { DateDisplay } from "./DateDisplay"
import { MoneyDisplay } from "./MoneyDisplay"
import { Rocket } from "./entities/Rocket"
import { Launchpad } from "./entities/Launchpad"
import { Rail } from "./entities/Rail"

export type MarsState = {
  money: number
  month: number
  year: number
}

export type MarsSettings = {}

const ticksPerMonth = 400

const MarsSystem = SystemBuilder({
  id: "MarsSystem",
  init: (world) => {
    let nextMonthTick = world.tick + ticksPerMonth

    return {
      id: "MarsSystem",
      query: [],
      priority: 2,
      onTick: () => {
        if (world.tick < nextMonthTick) return

        const state = world.state<MarsState>()

        while (world.tick >= nextMonthTick) {
          state.month += 1
          if (state.month > 11) {
            state.month = 0
            state.year += 1
          }

          nextMonthTick += ticksPerMonth
        }
      }
    }
  }
})

export const Mars: GameBuilder<MarsState, MarsSettings> = {
  id: "mars",
  init: (world) => ({
    id: "mars",
    netcode: "delay",
    renderer: "pixi",
    settings: {},
    state: {
      money: 0,
      month: 11,
      year: 2015
    },
    systems: [
      PixiRenderSystem,
      PixiCameraSystem(),
      ShadowSystem,
      MarsSystem
    ],
    entities: [
      Background({ move: 0.2, rays: true }),
      EscapeMenu(world),
      HtmlFpsText(),
      MoneyDisplay(),
      DateDisplay(),

      Beach({ width: 2000, height: 400, pos: { x: 0, y: 270 } }),
      Water2D({ pos: { x: 0, y: 90 } }),

      Launchpad(),
      Rail(),

      Rocket()
    ]
  })
}
