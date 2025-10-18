import {
  BlockPhysicsSystem, Apple, ThreeCameraSystem, ThreeNametagSystem, logPerf,
  min, UIProfile, Random, randomInt, SpawnSystem, Sky, SystemBuilder,
  XYZdistance, HtmlChat, Crosshair, GameBuilder, spawnTerrain, EscapeMenu,
  ThreeSystem, InventorySystem, BlockPreview, Sun, BlockMeshSysten, HUDSystem
} from "@piggo-gg/core"
import { Carl } from "./Carl"
import { MobileUI } from "./MobileUI"
import { CraftScoreboard } from "./CraftScoreboard"

export type CraftState = {
  applesEaten: Record<string, number>
  doubleJumped: string[]
  hit: Record<string, { tick: number, by: string }>
  lastShot: Record<string, number>
  nextSeed: number
  phase: "warmup" | "starting" | "play"
  round: number
  startedEagle: string[]
  willStart: undefined | number
}

export type CraftSettings = {
  ambientSound: boolean
  showControls: boolean
  showCrosshair: boolean
  showNametags: boolean
  mouseSensitivity: number
}

export const Craft: GameBuilder<CraftState, CraftSettings> = {
  id: "craft",
  init: (world) => ({
    id: "craft",
    netcode: "rollback",
    renderer: "three",
    settings: {
      ambientSound: true,
      showControls: true,
      showCrosshair: true,
      showNametags: true,
      mouseSensitivity: 1
    },
    state: {
      applesEaten: {},
      doubleJumped: [],
      hit: {},
      lastShot: {},
      nextSeed: 123456111,
      phase: "warmup",
      round: 0,
      startedEagle: [],
      willStart: undefined
    },
    systems: [
      SpawnSystem(Carl),
      BlockPhysicsSystem("global"),
      BlockPhysicsSystem("local"),
      ThreeCameraSystem(),
      CraftSystem,
      HUDSystem,
      ThreeNametagSystem,
      ThreeSystem,
      InventorySystem,
      BlockMeshSysten
    ],
    entities: [
      Crosshair(),
      EscapeMenu(world),
      // UIProfile(),
      CraftScoreboard(),
      HtmlChat(),
      Sun(),
      Sky()
    ]
  })
}

const CraftSystem = SystemBuilder({
  id: "CraftSystem",
  init: (world) => {
    spawnTerrain(world, 24)

    const mobileUI = MobileUI(world)

    const preview = BlockPreview(world)
    if (preview) world.three?.scene.add(preview.mesh)

    let applesSpawned = false
    let ambient = false

    return {
      id: "CraftSystem",
      query: [],
      priority: 3,
      onTick: () => {
        const state = world.state<CraftState>()
        const settings = world.settings<CraftSettings>()

        if (world.client && !world.client.mobile) world.client.menu = document.pointerLockElement === null

        const { sound } = world.client ?? {}

        mobileUI?.update()

        const pc = world.client?.character()
        if (pc && preview) preview.update(world.three!.camera.pos(), world.three!.camera.dir(world))

        // ambient sound
        if (!ambient && sound?.ready && settings.ambientSound) {
          ambient = sound.play({ name: "birdsong1" })
        } else if (sound?.tones.birdsong1.state === "stopped") {
          ambient = false
        } else if (ambient && !settings.ambientSound) {
          sound?.stop("birdsong1")
          ambient = false
        }

        const players = world.players()
        const characters = world.characters()

        let shouldStart = false

        // start if all players ready
        if (world.mode === "server" && state.phase === "warmup" && players.length > 1) {
          const notReady = players.filter(p => !p.components.pc.data.ready)
          if (notReady.length === 0) shouldStart = true
        }

        // start next round if no ducks left
        if (world.mode === "server" && state.phase === "play") {
          const ducks = characters.filter(c => !c.components.position.data.flying)

          if (ducks.length === 0) {
            if (characters.length === state.startedEagle.length) {
              const winner = players[0].components.pc.data.name
              world.announce(`${winner} wins! GG!`)

              state.phase = "warmup"
              state.startedEagle = []
              state.round = 0

              players.forEach(p => {
                p.components.pc.data.ready = false
                p.components.pc.data.points = 0
              })
            } else {
              shouldStart = true
            }
          }
        }

        if (shouldStart) {
          state.phase = "starting"
          state.willStart = world.tick + 40 * 3
          state.nextSeed = randomInt(1000000)
        }

        if (state.phase === "starting" && world.tick === state.willStart!) {

          world.announce(`round ${state.round + 1}!`)

          // update state
          state.applesEaten = {}
          state.phase = "play"
          state.round += 1

          // new random seed
          world.random = Random(state.nextSeed)

          // reset world state
          world.blocks.clear()
          world.trees = []

          // rebuild the world
          spawnTerrain(world, 24)

          // reset player positions
          for (const character of characters) {
            const { position } = character.components

            position.setPosition({ x: 14 + world.random.int(12, 6), y: 14 + world.random.int(12, 6), z: 6 })
            position.setVelocity({ x: 0, y: 0, z: 0 })
            position.data.flying = false
          }

          if (world.client) {
            world.client.controls.localAim.x = 0
            world.client.controls.localAim.y = -0.2
          }

          // choose who starts as eagle
          const candidates = characters.filter(c => !state.startedEagle.includes(c.id))
          const eagle = world.random.choice(candidates)
          if (eagle) {
            eagle.components.position.data.flying = true
            eagle.components.position.setPosition({ x: 15, y: 31, z: 6 })

            state.startedEagle.push(eagle.id)
          }
        }

        const t1 = performance.now()
        for (const player of players) {
          const character = player.components.controlling?.getCharacter(world)
          if (!character) continue

          const { position } = character.components
          const { z, rotation, standing } = position.data

          // double-jump state cleanup
          if (standing) {
            state.doubleJumped = state.doubleJumped.filter(id => id !== character.id)
          }

          // reset rotation
          position.data.rotating = 0
          if (rotation < 0) position.data.rotating = min(0.08, -rotation)
          if (rotation > 0) position.data.rotating = -1 * min(0.08, rotation)

          // fell off the map
          if (z < -4) {
            position.setPosition({ x: 20, y: 20, z: 8 })
          }

          if ((world.tick - state.hit[character.id]?.tick) >= 40) {
            position.setPosition({ x: 20, y: 20, z: 8 })
            delete state.hit[character.id]
          }

          // if eagle, check if eaten a duck
          if (world.mode === "server" && position.data.flying) {
            const ducks = characters.filter(c => c.components.position.data.flying === false)

            for (const duck of ducks) {
              const duckPos = duck.components.position

              const distance = XYZdistance(position.data, duckPos.data)

              if (distance < 0.24) {
                if (state.phase === "play") {
                  duckPos.data.flying = true
                  player.components.pc.data.points += 3
                  world.announce(`${player.components.pc.data.name} caught a duck!`)
                } else {
                  duckPos.setPosition({ x: 20, y: 20, z: 6 })
                }
              }
            }
          }
        }
        logPerf("player positions", t1)

        // spawn apples
        if (!applesSpawned) {
          for (let i = 0; i < 25; i++) {
            world.addEntity(Apple({ id: `d3apple-${1 + i}` }))
          }
          applesSpawned = true
        }
      }
    }
  }
})
