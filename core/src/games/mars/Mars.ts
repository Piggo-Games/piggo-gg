import {
  Background, Cursor, Date, EscapeMenu, GameBuilder, HtmlFpsText, HUDSystem,
  HUDSystemProps, nextDay, PhysicsSystem, PixiCameraSystem, PixiRenderSystem, Position,
  screenWH, ShadowSystem, SystemBuilder, Water2D
} from "@piggo-gg/core"
import { Beach } from "../island/terrain/Beach"
import { DateDisplay } from "./ui/DateDisplay"
import { LaunchButton } from "./ui/LaunchButton"
import { MoneyDisplay } from "./ui/MoneyDisplay"
import { Rocket } from "./things/Rocket"
import { Launchpad } from "./things/Launchpad"
import { Rail } from "./things/Rail"

export type MarsState = {
  money: number
  date: Date
  farLinkIncome: number
  contractRevenue: number
  rocketComponentSpend: number
  launching: boolean
}

export type MarsSettings = {
  showControls: boolean
}

const ticksPerDay = 12
const launchMaxZ = 3500
const launchSpeed = 20

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

        if (world.tick - lastDayTick >= ticksPerDay && !state.launching) {
          lastDayTick = world.tick

          state.date = nextDay(state.date)
        }

        if (state.launching) {
          const rocket = world.entity<Position>("rocket")
          if (!rocket) {
            state.launching = false
            return
          }

          const { position } = rocket.components
          if (state.launching && position.data.velocity.z === 0) {
            position.setVelocity({ z: launchSpeed })
          }

          if (position.data.z >= launchMaxZ) {
            state.launching = false
            position.setVelocity({ z: 0 })
            position.setPosition({ z: 0 })
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
    settings: {
      showControls: true
    },
    state: {
      money: 1000,
      date: { day: 1, month: "Jan", year: 2026 },
      farLinkIncome: 0,
      contractRevenue: 0,
      rocketComponentSpend: 0,
      launching: false
    },
    systems: [
      PixiRenderSystem,
      PhysicsSystem("global"),
      PhysicsSystem("local"),
      PixiCameraSystem({
        resize: () => screenWH().h / 936 * 2.6
      }),
      ShadowSystem,
      MarsSystem,
      HUDSystem(controls)
    ],
    entities: [
      Background({ move: 0.2, rays: true, follow: true }),
      Beach({ width: 2000, height: 400, pos: { x: 0, y: 270 } }),
      Water2D({ pos: { x: 0, y: 90 } }),
      Launchpad(),
      Rail(),
      Rocket(),

      EscapeMenu(world),
      Cursor(),

      MoneyDisplay(),
      DateDisplay(),
      LaunchButton(),

      HtmlFpsText()
    ]
  })
}


const controls: HUDSystemProps = {
  clusters: [
    {
      label: "menu",
      buttons: [["esc"]]
    }
  ]
}
