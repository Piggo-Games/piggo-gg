import {
  Actions, Component, Effects, Entity, Networked, Position,
  ProtoEntity, SystemBuilder, XY, abs, hypot, min, pickupItem, round
} from "@piggo-gg/core"

export type Item = Component<"item"> & {
  name: string
  dropped: boolean
  equipped: boolean
  stackable: boolean
  onTick: undefined | (() => void)
}

export type ItemActionParams = {
  mouse: XY
  entity: string
  tick: number
  character: string
  hold: boolean
}

export type ItemProps = {
  name: string
  flips?: boolean
  dropped?: boolean
  equipped?: boolean
  stackable?: boolean
  onTick?: () => void
}

export const Item = ({ name, dropped, equipped, stackable, onTick }: ItemProps): Item => ({
  name,
  type: "item",
  dropped: dropped ?? false,
  equipped: equipped ?? false,
  stackable: stackable ?? false,
  onTick
})

export type ItemComponents = Position | Actions | Effects | Item | Networked
export type ItemEntity = Entity<ItemComponents>

// override some components
export const ItemEntity = (entity: ProtoEntity<ItemComponents>): ItemEntity => {
  entity.components.actions.actionMap.pickupItem = pickupItem

  return Entity(entity)
}

export const ItemSystem = SystemBuilder({
  id: "ItemSystem",
  init: () => ({
    id: "ItemSystem",
    query: ["item", "renderable", "position"],
    priority: 5,
    onTick: (entities: Entity<Item | Position>[]) => {
      for (const entity of entities) {
        const { position, item } = entity.components
        const { pointingDelta, rotation, follows } = position.data

        if (!follows) continue

        if (rotation) position.rotate(rotation > 0 ? -0.1 : 0.1, true)

        if (!item.dropped) {
          const hypotenuse = hypot(pointingDelta.x, pointingDelta.y)

          const hyp_x = pointingDelta.x / hypotenuse
          const hyp_y = pointingDelta.y / hypotenuse

          position.data.offset = {
            x: round(hyp_x * min(20, abs(pointingDelta.x)), 2),
            y: round(hyp_y * min(20, abs(pointingDelta.y)) - 7, 2)
          }
        }
      }
    }
  })
})
