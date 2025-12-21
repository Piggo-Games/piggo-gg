import {
  Background, Cursor, EscapeMenu, GameBuilder, HUDSystem, HUDSystemProps, HtmlChat,
  HtmlFpsText, HtmlLagText, InventorySystem, ItemSystem, PixiNametagSystem,
  PhysicsSystem, PixiCameraSystem, PixiDebugSystem, PixiRenderSystem, min,
  ShadowSystem, SpawnSystem, SystemBuilder, Water2D, screenWH, DummyPlayer, HtmlJoystickEntity
} from "@piggo-gg/core"
import { Patrick } from "./enemies/Patrick"
import { Ian } from "./Ian"
import { Dice } from "./Dice"
import { Beach, BeachWall, OuterBeachWall } from "./terrain/Beach"
import { Flag } from "./terrain/Flag"
import { Pier } from "./terrain/Pier"
import { NumBoard } from "./ui/NumBoard"
import { HeartSystem } from "./ui/HeartSystem"
import { Scroll, ScrollProps } from "./ui/Scroll"
import { TargetBoard } from "./ui/TargetBoard"

const arenaWidth = 500

export type D6 = 1 | 2 | 3 | 4 | 5 | 6
export type Roll = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 67

export type IslandState = {
  round: number
  turnPhase: "players" | "monster"
  turnIndex: number
  turnTarget: Roll | null
  rollId: number
  handledRollId: number
  autoRollAt: number | null
  advanceAt: number | null
  shooter: string | null
  die1: D6 | null
  die2: D6 | null
  rolled: Roll | null
  selectedAbility: string | null
}

export type IslandSettings = {
  showControls: boolean
}

const scrollAbilities: ScrollProps[] = [
  {
    id: "rally",
    title: "Rally",
    description: "allies take 1 less DMG per hit until your next turn",
    manaCost: 1,
    position: { x: -46, y: 130 }
  },
  {
    id: "slice",
    title: "Slice",
    description: "enemies take 1D6 extra DMG per hit until your next turn",
    manaCost: 1,
    position: { x: 46, y: 130 }
  }
]

export const Island: GameBuilder<IslandState, IslandSettings> = {
  id: "island",
  init: (world) => ({
    id: "island",
    netcode: "rollback",
    renderer: "pixi",
    settings: {
      showControls: true
    },
    state: {
      round: 1,
      turnPhase: "players",
      turnIndex: 0,
      turnTarget: null,
      rollId: 0,
      handledRollId: 0,
      autoRollAt: null,
      advanceAt: null,
      shooter: null,
      die1: null,
      die2: null,
      rolled: null,
      selectedAbility: null
    },
    systems: [
      PhysicsSystem("local"),
      PhysicsSystem("global"),
      SpawnSystem({ spawner: Ian, pos: { x: 0, y: 0, z: 0 } }),
      IslandSystem,
      PixiRenderSystem,
      HUDSystem(controls),
      PixiCameraSystem({
        resize: () => {
          const { w } = screenWH()
          return min(3.4, w / (arenaWidth * 1.1))
        }
      }),
      PixiDebugSystem,
      InventorySystem,
      ItemSystem,
      ShadowSystem,
      HeartSystem(),
      PixiNametagSystem()
    ],
    entities: [
      Background({ rays: true }),
      BeachWall(),
      OuterBeachWall(),
      Beach(),
      // Pier(),
      Flag(),
      Patrick(),
      Water2D(),
      Dice(1),
      Dice(2),

      // DummyPlayer(),

      NumBoard(),
      TargetBoard(),
      ...scrollAbilities.map((scroll) => Scroll(scroll)),

      Cursor(),
      EscapeMenu(world),
      HtmlChat(),
      HtmlLagText(),
      HtmlFpsText(),

      HtmlJoystickEntity("left", "move")
    ]
  })
}

const IslandSystem = SystemBuilder({
  id: "IslandSystem",
  init: (world) => {

    const monsterId = "patrick"

    const beginTurn = (state: IslandState, actorId: string | null) => {
      state.shooter = actorId
      state.turnTarget = null
      state.autoRollAt = null
    }

    const beginPlayerTurn = (state: IslandState, characters: { id: string }[]) => {
      console.log("beginPlayerTurn", state.turnIndex, characters)

      state.turnPhase = "players"
      if (characters.length === 0) {
        beginTurn(state, null)
        return
      }

      if (state.turnIndex >= characters.length) {
        state.turnIndex = 0
      }

      beginTurn(state, characters[state.turnIndex]?.id ?? null)
    }

    const beginMonsterTurn = (state: IslandState) => {
      state.turnPhase = "monster"
      state.turnIndex = 0
      beginTurn(state, monsterId)
      state.autoRollAt = world.tick + 20
    }

    const advanceTurn = (state: IslandState, characters: { id: string }[]) => {
      state.rolled = null
      state.die1 = null
      state.die2 = null

      if (state.turnPhase === "monster") {
        state.round += 1
        state.turnPhase = "players"
        state.turnIndex = 0
        beginPlayerTurn(state, characters)
        return
      }

      state.turnIndex += 1

      if (state.turnIndex >= characters.length) {
        beginMonsterTurn(state)
        return
      }

      beginPlayerTurn(state, characters)
    }

    const scheduleMonsterRoll = (state: IslandState) => {
      state.autoRollAt = world.tick + 20
    }

    const maybeAutoRollMonster = (state: IslandState) => {
      if (state.turnPhase !== "monster") return
      if (state.shooter !== monsterId) return
      if (state.autoRollAt === null || world.tick < state.autoRollAt) return

      state.autoRollAt = null

      const pointingDelta = { x: -140, y: 0 }
      world.actions.push(world.tick, "dice-1", { actionId: "roll", params: { shooterId: monsterId, pointingDelta } })
      world.actions.push(world.tick, "dice-2", { actionId: "roll", params: { shooterId: monsterId, pointingDelta } })
    }

    const triggerAbility = (_: { state: IslandState, shooterId: string }) => {
      console.log("ABILITY")
    }

    const triggerCrit = (_: { state: IslandState, shooterId: string, die1: D6, die2: D6 }) => {
      console.log("CRIT")
    }

    return {
      id: "IslandSystem",
      query: [],
      priority: 6,
      onTick: () => {
        const state = world.state<IslandState>()

        const characters = world.characters()

        if (state.advanceAt !== null && world.tick >= state.advanceAt) {
          state.advanceAt = null
          advanceTurn(state, characters)
          return
        }

        if (state.shooter === null) {
          beginPlayerTurn(state, characters)
        } else if (state.turnPhase === "players") {
          const expected = characters[state.turnIndex]?.id ?? null
          if (state.shooter !== expected) {
            beginPlayerTurn(state, characters)
          }
        } else if (state.turnPhase === "monster" && state.shooter !== monsterId) {
          beginMonsterTurn(state)
        }

        maybeAutoRollMonster(state)

        if (state.die1 && state.die2 && state.rolled === null) {
          let result = state.die1 + state.die2
          if ((state.die1 === 6 && state.die2 === 1) || (state.die1 === 1 && state.die2 === 6)) {
            result = 67
          }

          state.rolled = result as Roll
          state.rollId += 1

          // damage on 7
          if (state.rolled === 7 && state.shooter) {
            const character = world.entity(state.shooter)
            if (character) {
              // character.components.renderable!.setOverlay({ alpha: 0.7, color: 0xff4444 })
            }
          }
        }

        if (state.die1 === null || state.die2 === null) {
          state.rolled = null
        }

        if (state.rolled !== null && state.rollId !== state.handledRollId) {
          state.handledRollId = state.rollId

          if (state.rolled === 67 && state.shooter && state.die1 && state.die2) {
            triggerCrit({ state, shooterId: state.shooter, die1: state.die1, die2: state.die2 })
            world.client?.sound.play({ name: "jingle1" })
            state.advanceAt = world.tick + 40
            return
          }

          if (state.rolled === 7) {
            world.client?.sound.play({ name: "spike" })
            state.advanceAt = world.tick + 40
            return
          }

          if (state.turnTarget === null) {
            state.turnTarget = state.rolled
            if (state.turnPhase === "monster") {
              scheduleMonsterRoll(state)
            }
            return
          }

          if (state.rolled === state.turnTarget) {
            if (state.shooter) {
              world.client?.sound.play({ name: "jingle1" })
              triggerAbility({ state, shooterId: state.shooter })
            }
            state.advanceAt = world.tick + 40
            return
          }

          if (state.turnPhase === "monster") {
            scheduleMonsterRoll(state)
          }
        }
      }
    }
  }
})

const controls: HUDSystemProps = {
  direction: "row",
  from: { top: 26, left: 26 },
  clusters: [
    {
      label: "menu",
      buttons: [["esc"]]
    },
    {
      label: "move",
      buttons: [
        ["A", "S", "D"],
        ["W"]
      ]
    },
    {
      label: "roll",
      buttons: [["mb1"]]
    }
  ]
}
