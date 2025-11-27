import { Data, Entity, Networked, NetworkedComponentData, ValidComponents, World } from "@piggo-gg/core"

// a System is a function that runs on every tick
export interface System<T extends string = string> {
  id: T,
  query: ValidComponents[]
  priority: number
  data?: NetworkedComponentData
  skipOnRollback?: boolean
  onTick?: (entities: Entity[], isRollback: boolean) => void
  onRender?: (entities: Entity[], deltaMS: number, since: number) => void
  onRollback?: () => void
}

export type SystemBuilder<T extends string = string> = {
  id: T,
  init: (world: World) => System<T> | undefined
}

export const SystemBuilder = <T extends string = string>(builder: SystemBuilder<T>): SystemBuilder<T> => builder

export const ClientSystemBuilder = <T extends string = string>(builder: SystemBuilder<T>): SystemBuilder<T> => ({
  ...builder,
  init: (world: World) => {
    return (world.mode === "client") ? builder.init(world) : undefined
  }
})

export type SystemEntityProps = {
  systemId: string
  data: NetworkedComponentData
}

// a system entity is a special entity that stores networked system data
export const SystemEntity = ({ systemId, data }: SystemEntityProps) => Entity({
  id: `SystemEntity-${systemId}`,
  persists: true,
  components: {
    networked: Networked(),
    data: Data({ data }),
  }
})
