import { Entity, SystemBuilder, World } from "@piggo-gg/core"

export type GameTitle = "lobby" | "volley" | "craft" | "strike" | "volley3d" | ""
export const GameTitle: GameTitle[] = ["lobby", "volley", "craft", "strike", "volley3d"]

export type Game<State extends {} = {}, Settings extends {} = {}> = {
  id: GameTitle
  entities: Entity[]
  netcode: "rollback" | "delay"
  renderer: "three" | "pixi"
  settings: Settings
  state: State
  systems: SystemBuilder[]
}

export type GameBuilder<State extends {} = {}, Settings extends {} = {}> = {
  id: GameTitle
  init: (world: World) => Game<State, Settings>
}
