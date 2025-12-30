import { Background, EscapeMenu, GameBuilder, HtmlFpsText, PixiCameraSystem, PixiRenderSystem, screenWH, ShadowSystem, SystemBuilder, Water2D } from "@piggo-gg/core"
import { Beach } from "../island/terrain/Beach"
import { DateDisplay } from "./ui/DateDisplay"
import { MoneyDisplay } from "./ui/MoneyDisplay"
import { Rocket } from "./things/Rocket"
import { Launchpad } from "./things/Launchpad"
import { Rail } from "./things/Rail"

export type MarsState = {
  money: number
  day: number
  month: number
  year: number
}

export type MarsSettings = {}

const daysPerMonth = 30
const ticksPerDay = 12

const MarsSystem = SystemBuilder({
  id: "MarsSystem",
  init: (world) => {

    let lastDayTick = world.tick

    return {
      id: "MarsSystem",
      query: [],
      priority: 2,
      onTick: () => {
        const state = world.state<MarsState>()

        if (world.tick - lastDayTick >= ticksPerDay) {
          lastDayTick = world.tick

          state.day += 1

          if (state.day > daysPerMonth) {
            state.day = 1
            state.month += 1

            if (state.month > 11) {
              state.month = 0
              state.year += 1
            }
          }
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
      money: 1000,
      day: 22,
      month: 11,
      year: 2015
    },
    systems: [
      PixiRenderSystem,
      PixiCameraSystem({
        resize: () => {
          const { h } = screenWH()
          return h / 936 * 2.5
        }
      }),
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
