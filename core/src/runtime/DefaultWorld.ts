import {
  ActionSystem, CommandSystem, ControlSystem, DebugCommand,
  ExpiresSystem, GameCommand, HtmlSystem, InputSystem, NPCSystem, PositionSystem,
  RandomSystem, World, WorldBuilder, WorldProps
} from "@piggo-gg/core"

export const DefaultWorld: WorldBuilder = (props: WorldProps) => World({
  ...props,
  commands: [GameCommand, DebugCommand],
  systems: [
    RandomSystem, ExpiresSystem, ControlSystem, InputSystem,
    HtmlSystem, CommandSystem, NPCSystem, ActionSystem, PositionSystem
  ]
})
