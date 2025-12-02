import { Client, ClientSystemBuilder, Component, ThreeRenderer, Entity, Position, World, min, max } from "@piggo-gg/core"
import { Color, Mesh, Object3D, Object3DEventMap } from "three"

type ThreeInit = (_: { o: Object3D<Object3DEventMap>[], entity: Entity<Three | Position>, world: World, three: ThreeRenderer }) => Promise<void>

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
  emission: number
  o: Object3D[]
  init: undefined | ThreeInit
  onRender: undefined | ((_: OnRenderProps) => void)
  onTick: undefined | ((_: Omit<OnRenderProps, "delta" | "since">) => void)
  cleanup: (world: World) => void
  flash: (intensity: number) => void
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
    emission: 0,
    o: [],
    init: props.init,
    onRender: props.onRender,
    onTick: props.onTick,
    cleanup: (world) => {
      world.three?.scene.remove(...three.o)
    },
    flash: (intensity: number) => {
      three.emission = min(1, three.emission + intensity)

      for (const o of three.o) {
        o.traverse((child) => {
          if (child instanceof Mesh) {
            const mat = (child as any).material
            if (mat) {
              if (mat.emissive) {
                mat.emissiveIntensity = three.emission
                mat.emissive = new Color(0xffffff)
              }
            }
          }
        })
      }
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
            three.init({ o: three.o, entity, world, three: world.three })
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

        // handle emission decay
        for (const entity of entities) {
          const { three } = entity.components
          if (three.emission > 0) {
            three.emission = max(0, three.emission - since / 25 / 20)

            for (const o of three.o) {
              o.traverse((child) => {
                if (child instanceof Mesh) {
                  const mat = (child as any).material
                  if (mat) {
                    if (mat.emissive) {
                      mat.emissiveIntensity = three.emission
                    }
                  }
                }
              })
            }
          }
        }
      }
    }
  }
})
