import {
  Background, Cursor, EscapeMenu, GameBuilder, HUDSystem, HUDSystemProps, HtmlChat,
  HtmlFpsText, HtmlLagText, InventorySystem, ItemSystem, PixiNametagSystem, PhysicsSystem,
  PixiCameraSystem, PixiDebugSystem, PixiRenderSystem, min, ShadowSystem, SpawnSystem,
  SystemBuilder, Water2D, screenWH, DummyPlayer, HtmlJoystickEntity, randomInt
} from "@piggo-gg/core"
import { Patrick } from "./enemies/Patrick"
import { Ian } from "./Ian"
import { Dice } from "./Dice"
import { Beach, BeachWall, OuterBeachWall } from "./terrain/Beach"
import { Flag } from "./terrain/Flag"
import { Pier } from "./terrain/Pier"
import { NumBoard } from "./ui/NumBoard"
import { HeartSystem } from "./ui/HeartSystem"
import { RallyScroll, Scroll, ScrollProps, SliceScroll } from "./ui/Scroll"
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
  rollQueued: boolean
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
      rollQueued: false,
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
      RallyScroll(),
      SliceScroll(),

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
    const monsterPointingDelta = { x: -140, y: 0 }

    const queueDiceRoll = (shooterId: string, pointingDelta: { x: number, y: number }, delay = 1) => {
      const shooter = world.entity(shooterId)
      world.actions.push(world.tick + delay, "dice-1", { actionId: "roll", params: { shooterId, pointingDelta } })
      world.actions.push(world.tick + delay, "dice-2", { actionId: "roll", params: { shooterId, pointingDelta } })
      shooter?.components.renderable?.setAnimation("spike")
    }

    const beginTurn = (state: IslandState, actorId: string | null) => {
      state.shooter = actorId
      state.turnTarget = null
      state.autoRollAt = null
      state.rollQueued = false
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
      state.turnTarget = null
      state.selectedAbility = null

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

    const maybeAutoRoll = (state: IslandState) => {
      if (state.autoRollAt === null || world.tick < state.autoRollAt) return

      const shooterId = state.shooter
      state.autoRollAt = null

      if (!shooterId) return

      if (state.turnPhase === "monster") {
        queueDiceRoll(shooterId, monsterPointingDelta, 0)
        state.rollQueued = true
        return
      }

      if (state.turnPhase === "players" && state.selectedAbility) {
        const pointingDelta = { x: randomInt(100) + 50, y: 0 }
        queueDiceRoll(shooterId, pointingDelta)
        state.rollQueued = true
      }
    }

    const triggerAbility = (payload: { state: IslandState, shooterId: string, abilityId: string, roll: Roll }) => {
      console.log("ABILITY", payload.abilityId, payload.roll)
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

        if (state.turnPhase === "players"
          && state.shooter
          && state.selectedAbility
          && state.autoRollAt === null
          && !state.rollQueued
          && state.die1 === null
          && state.die2 === null
          && state.rolled === null
        ) {
          state.autoRollAt = world.tick
        }

        maybeAutoRoll(state)

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

          if (state.turnPhase === "players" && state.shooter && state.selectedAbility) {
            world.client?.sound.play({ name: "jingle1" })
            triggerAbility({
              state,
              shooterId: state.shooter,
              abilityId: state.selectedAbility,
              roll: state.rolled
            })
          }

          state.advanceAt = world.tick + 40
          return
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
    }
  ]
}
