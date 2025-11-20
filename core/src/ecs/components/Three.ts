import { Client, ClientSystemBuilder, Component, ThreeRenderer, Entity, Position, World } from "@piggo-gg/core"
import { Object3D, Object3DEventMap } from "three"

type ThreeInit = (o: Object3D<Object3DEventMap>[], entity: Entity<Three | Position>, world: World, three: ThreeRenderer) => Promise<void>

type OnRenderProps = {
  entity: Entity<Three | Position>
  world: World
  client: Client
  delta: number
  since: number
  three: ThreeRenderer
}

export type Three = Component<"three", {}> & {
  initialized: boolean
  o: Object3D[]
  init: undefined | ThreeInit
  onRender: undefined | ((_: OnRenderProps) => void)
  onTick: undefined | ((_: Omit<OnRenderProps, "delta" | "since">) => void)
  cleanup: (world: World) => void
}

export type ThreeProps = {
  init?: ThreeInit
  onRender?: (_: OnRenderProps) => void
  onTick?: (_: Omit<OnRenderProps, "delta" | "since">) => void
}

export const Three = (props: ThreeProps = {}): Three => {
  const three: Three = {
    type: "three",
    data: {},
    initialized: false,
    o: [],
    init: props.init,
    onRender: props.onRender,
    onTick: props.onTick,
    cleanup: (world) => {
      world.three?.scene.remove(...three.o)
    }
  }

  return three
}

export const ThreeSystem = ClientSystemBuilder<"ThreeSystem">({
  id: "ThreeSystem",
  init: (world) => {

    const rendered: Record<string, Object3D[]> = {}

    return {
      id: "ThreeSystem",
      priority: 11,
      query: ["position", "three"],
      onTick: (entities: Entity<Three | Position>[]) => {
        if (!world.three) return

        for (const entity of entities) {
          const { three } = entity.components

          if (three.init && !three.initialized) {
            if (rendered[entity.id]) {
              world.three?.scene.remove(...three.o)
              rendered[entity.id] = []
            }
            three.init(entity.components.three.o, entity, world, world.three)
            three.initialized = true
            continue
          }

          if (!rendered[entity.id]) rendered[entity.id] = []

          for (const o of three.o) {
            if (!rendered[entity.id].includes(o)) {
              rendered[entity.id].push(o)
              world.three?.scene.add(o)
            }
          }

          three.onTick?.({ entity, world, client: world.client!, three: world.three! })
        }
      },
      onRender: (entities: Entity<Three | Position>[], delta, since) => {
        for (const entity of entities) {
          const { three } = entity.components
          three.onRender?.({ entity, world, client: world.client!, delta, since, three: world.three! })
        }
      }
    }
  }
})
