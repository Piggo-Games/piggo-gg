import {
  ActionSystem, CommandSystem, ControlSystem, DebugCommand,
  ExpiresSystem, GameCommand, InputSystem, NPCSystem, PositionSystem,
  RandomSystem, World, WorldBuilder, WorldProps
} from "@piggo-gg/core"

export const DefaultWorld: WorldBuilder = (props: WorldProps) => World({
  ...props,
  commands: [GameCommand, DebugCommand],
  systems: [
    RandomSystem, ExpiresSystem, ControlSystem, InputSystem,
    CommandSystem, NPCSystem, ActionSystem, PositionSystem
  ]
})
