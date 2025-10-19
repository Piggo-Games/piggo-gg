import {
  BlockData, Character, Client, Command, ComponentTypes, Data, Entity,
  Game, GameBuilder, InvokedAction, Networked, Player, Random, PixiRenderer,
  SerializedEntity, System, SystemBuilder, SystemEntity, TickBuffer,
  ValidComponents, XYZ, keys, logPerf, values, ThreeRenderer, filterEntities,
  Lobby, Volley, Craft, Strike, GameTitle, Volley3d
} from "@piggo-gg/core"

export type World = {
  actions: TickBuffer<InvokedAction>
  blocks: BlockData
  client: Client | undefined
  commands: Record<string, Command>
  debug: boolean
  entities: Record<string, Entity>
  entitiesAtTick: Record<number, Record<string, SerializedEntity>>
  game: Game & { started: number }
  games: Record<GameTitle, GameBuilder>
  lastTick: DOMHighResTimeStamp
  messages: TickBuffer<string>
  mode: "client" | "server"
  pixi: PixiRenderer | undefined
  random: Random
  systems: Record<string, System>
  three: ThreeRenderer | undefined
  tick: number
  tickrate: number
  time: DOMHighResTimeStamp
  trees: XYZ[] // TODO rm !!
  addEntities: (entities: Entity[]) => void
  addEntity: (entity: Entity, timeout?: number) => string | undefined
  addSystemBuilders: (systemBuilders: SystemBuilder[]) => void
  addSystems: (systems: System[]) => void
  announce: (message: string) => void
  characters: () => Character[]
  entity: <T extends ComponentTypes>(id: string) => Entity<T> | undefined
  onTick: (_: { isRollback: boolean }) => void
  onRender: () => void
  players: () => Player[]
  queryEntities: <T extends ComponentTypes>(query: ValidComponents[], filter?: (entity: Entity<T>) => boolean) => Entity<T>[]
  removeEntity: (id: string) => void
  removeSystem: (id: string) => void
  setGame: (game: GameTitle) => void
  settings: <S extends {}>() => S
  state: <S extends {}>() => S
}

export type WorldBuilder = (_: WorldProps) => World

export type WorldProps = {
  commands?: Command[]
  game: GameTitle
  systems?: SystemBuilder[]
  three?: ThreeRenderer
  pixi?: PixiRenderer | undefined
  mode?: "client" | "server"
}

// World manages all runtime state
export const World = ({ commands, game, systems, pixi, mode, three }: WorldProps): World => {

  const scheduleOnTick = () => setTimeout(() => world.onTick({ isRollback: false }), 3)

  let lastRender = 0

  const world: World = {
    actions: TickBuffer(),
    blocks: BlockData(),
    messages: TickBuffer(),
    client: undefined,
    commands: {},
    debug: false,
    entities: {},
    entitiesAtTick: {},
    game: { id: "", renderer: "three", entities: [], settings: {}, systems: [], netcode: "delay", state: {}, started: 0 },
    games: { "craft": Craft, "lobby": Lobby, "strike": Strike, "volley": Volley, "volley3d": Volley3d, "": Lobby },
    lastTick: 0,
    mode: mode ?? "client",
    pixi,
    random: Random(123456111),
    systems: {},
    three,
    tick: 0,
    tickrate: 25,
    time: performance.now(),
    trees: [],
    addEntity: (entity: Entity) => {
      const oldEntity = world.entities[entity.id]
      if (oldEntity?.components.renderable || oldEntity?.components.three) {
        oldEntity.removed = true
        oldEntity.components.renderable?.cleanup()
        oldEntity.components.three?.cleanup(world)
      }

      world.entities[entity.id] = entity
      return entity.id
    },
    addEntities: (entities: Entity[]) => {
      entities.forEach((entity) => world.addEntity(entity))
    },
    characters: () => {
      return world.players().map(p => p.components.controlling?.getCharacter(world)).filter(Boolean) as Character[]
    },
    removeEntity: (id: string) => {
      const entity = world.entities[id]
      if (entity) {
        delete world.entities[id]
        entity.components.renderable?.cleanup()
        entity.components.three?.cleanup(world)
        entity.components.inventory?.cleanup(world)

        entity.removed = true
      }
    },
    removeSystem: (id: string) => {
      const system = world.systems[id]
      if (system && system.data) world.removeEntity(`SystemEntity-${id}`)
      if (system) delete world.systems[id]
    },
    addSystems: (systems: System[]) => {
      systems.forEach((system) => {
        if (world.systems[system.id]) {
          console.error(`not inserting duplicate system id ${system.id}`)
          return
        }
        world.systems[system.id] = system
        if (system.data) {
          world.addEntity(SystemEntity({ systemId: system.id, data: system.data }))
        }
      })
    },
    addSystemBuilders: (systemBuilders: SystemBuilder[]) => {
      systemBuilders.forEach((systemBuilder) => {
        if (!world.systems[systemBuilder.id]) {
          const system = systemBuilder.init(world)
          if (system) world.addSystems([system])
        }
      })
    },
    announce: (message: string) => {
      world.messages.set(world.tick + 1, "game", [message])
    },
    entity: <T extends ComponentTypes>(id: string) => {
      return world.entities[id] as Entity<T>
    },
    onTick: ({ isRollback }) => {
      const now = performance.now()

      if (world.tick > 120 && world.players().length === 0) return

      // check if it's time to run the next tick
      if (!isRollback && ((world.lastTick + world.tickrate) > now)) {
        scheduleOnTick()
        return
      }

      // update lastTick
      if (!isRollback) {
        if ((now - world.tickrate - world.tickrate) > world.lastTick) {
          // catch up (browser was delayed)
          world.lastTick = now
        } else {
          // move forward at fixed timestep
          world.lastTick += world.tickrate
        }
      }

      // increment tick
      world.tick += 1
      world.time = now

      // store serialized entities
      world.entitiesAtTick[world.tick] = {}
      for (const entityId in world.entities) {
        if (world.entities[entityId].components.networked) {
          world.entitiesAtTick[world.tick][entityId] = world.entities[entityId].serialize()
        }
      }

      // run system onTick (sorted by priority)
      values(world.systems).sort((a, b) => a.priority - b.priority).forEach((system) => {
        if (!isRollback || (isRollback && !system.skipOnRollback)) {
          if (!world.systems[system.id]) return

          const now = performance.now()
          system.onTick?.(filterEntities(system.query, values(world.entities)), isRollback)
          logPerf(system.id, now)
        }
      })

      // schedule onTick
      if (!isRollback) scheduleOnTick()

      // clear old buffered data
      world.actions.clearBeforeTick(world.tick - 20)
      keys(world.entitiesAtTick).map(Number).forEach((tick) => {
        if ((world.tick - tick) > 20) {
          delete world.entitiesAtTick[tick]
        }
      })
    },
    onRender: () => {
      if (world.pixi || world.three) {
        const now = performance.now()
        values(world.systems).forEach((system) => {
          system.onRender?.(filterEntities(system.query, values(world.entities)), now - world.time, now - lastRender)
        })
        lastRender = now
      }
    },
    players: () => {
      return world.queryEntities(["pc"]) as Player[]
    },
    queryEntities: <T extends ComponentTypes>(query: ValidComponents[], filter: (entity: Entity<T>) => boolean = () => true) => {
      const entities = filterEntities(query, values(world.entities)) as Entity<T>[]
      return entities.filter(filter).sort((a, b) => a.id.localeCompare(b.id))
    },
    setGame: (gameTitle: GameTitle) => {
      const game = world.games[gameTitle]

      // console.log("SETTING GAME", gameTitle)

      // remove old entities
      values(world.entities).forEach((entity) => {
        if (!entity.persists) world.removeEntity(entity.id)
      })

      for (const el of values(document.getElementsByClassName("lex"))) {
        el.remove()
      }

      // remove dummies
      delete world.entities["player-dummy"]
      delete world.entities["player-dummy-2"]

      // stop music
      world.client?.sound.stopMusic()

      // clear blocks
      world.blocks.clear()
      world.trees = []

      // reset cursor style
      document.body.style.cursor = "auto"

      // mobile menu
      if (world.client) world.client.menu = false

      // remove old systems
      world.game.systems.forEach((system) => world.removeSystem(system.id))

      // set game id
      world.game.id = game.id

      // set new game
      world.game = { ... game.init(world), started: world.tick + 2 }

      const gameStateEntity = Entity({
        id: "gameState",
        components: {
          data: Data({ data: world.game.state }),
          networked: Networked()
        }
      })
      world.addEntity(gameStateEntity)

      const { entities, systems } = world.game

      if (world.pixi) {
        world.pixi.camera.scaleTo(2.5)
      }

      // add new entities
      for (const entity of entities) {
        if (entity.persists && world.entity(entity.id)) continue
        world.addEntity(entity)
      }

      world.addSystemBuilders(systems)

      commands?.forEach((command) => world.commands[command.id] = command)

      // update renderer
      if (world.game.renderer === "pixi" && !world.pixi?.ready) {
        world.three?.deactivate()
        world.pixi?.activate(world)
      } else if (world.game.renderer === "three" && !world.three?.ready) {
        world.pixi?.deactivate()
        world.three?.activate(world)
      }
    },
    settings: <S extends {}>(): S => {
      return world.game.settings as S
    },
    state: <S extends {}>(): S => {
      return world.game.state as S
    }
  }

  // set up client
  if (world.mode === "client") world.client = Client({ world })

  // schedule onTick
  scheduleOnTick()

  if (systems) world.addSystemBuilders(systems)

  world.setGame(game)

  // setup commands
  if (commands) {
    commands.forEach((command) => world.commands[command.id] = command)
  }

  return world
}
