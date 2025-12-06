import {
  Actions, Component, Effects, ElementKinds, Entity, ItemBuilder, Networked, Position,
  ProtoEntity, Renderable, SystemBuilder, ValidSounds, Whack, World, XY, abs, hypot, loadTexture, min, pickupItem, round
} from "@piggo-gg/core"
import { Sprite } from "pixi.js"

export type Item = Component<"item"> & {
  name: string
  dropped: boolean
  equipped: boolean
  stackable: boolean
  onTick: undefined | ((world: World) => void)
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
  onTick?: (world: World) => void
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

        // console.log(position.xyz())        

        if (!item.dropped) {
          const hypotenuse = hypot(pointingDelta.x, pointingDelta.y)

          // console.log("delta", pointingDelta, "hypotenuse", hypotenuse)

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

type ElementToDamage = Record<ElementKinds, number>

export type ToolProps = {
  name: string
  sound: ValidSounds
  damage: ElementToDamage
}

export const Tool = (
  { name, sound, damage }: ToolProps
): ItemBuilder => ({ character, id }): ItemEntity => ItemEntity({
  id: id ?? `${name}-${character.id}`,
  components: {
    networked: Networked(),
    position: Position({ follows: character?.id ?? "" }),
    actions: Actions({
      // mb1: Whack(sound, (e => {
      //   const { element } = e.components
      //   return damage[element?.data.kind ?? "flesh"]
      // }))
    }),
    item: Item({ name, flips: true }),
    effects: Effects(),
    // clickable: Clickable({
    //   width: 20, height: 20, active: false, anchor: { x: 0.5, y: 0.5 }
    // }),
    renderable: Renderable({
      scaleMode: "nearest",
      zIndex: 3,
      scale: 2.5,
      anchor: { x: 0.5, y: 0.5 },
      interpolate: true,
      visible: true,
      rotates: true,
      // outline: { color: 0x000000, thickness: 1 },
      setup: async (r: Renderable) => {
        const textures = await loadTexture(`${name}.json`)

        r.c = new Sprite(textures["0"])
      }
    })
  }
})

export const Axe = Tool({ name: "axe", sound: "thud", damage: { flesh: 15, wood: 25, rock: 10 } })
export const Sword = Tool({ name: "sword", sound: "slash", damage: { flesh: 25, wood: 10, rock: 10 } })
export const Pickaxe = Tool({ name: "pickaxe", sound: "clink", damage: { flesh: 10, wood: 10, rock: 25 } })
