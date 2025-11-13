import {
  Actions, Character, Component, Entity, Input, Position,
  Renderable, SystemBuilder, Team, ItemEntity, World, Collider
} from "@piggo-gg/core"

export type ItemBuilder = (_: { id?: string, character: Character }) => ItemEntity

export type Inventory = Component<"inventory", {
  items: (string[] | undefined)[]
  activeItemIndex: number
}> & {
  itemBuilders: ItemBuilder[]
  activeItem: (world: World) => ItemEntity | null
  addItem: (item: ItemEntity, world: World) => void
  setItem: (index: number, item: ItemEntity, world: World) => void
  cleanup: (world: World) => void
  removeItem: (itemId: string, world: World) => void
  dropActiveItem: () => void
  setActiveItemIndex: (index: number) => void
}

export const Inventory = (itemBuilders: ItemBuilder[] = []): Inventory => {
  const inventory: Inventory = {
    data: {
      activeItemIndex: 0,
      items: [undefined, undefined, undefined, undefined, undefined, undefined, undefined]
    },
    type: "inventory",
    itemBuilders,
    activeItem: (world: World) => {
      const item = inventory.data.items[inventory.data.activeItemIndex]
      if (!item) return null

      const itemEntity = world.entities[item[0]]
      if (!itemEntity) return null

      return itemEntity as ItemEntity
    },
    addItem: (item: ItemEntity, world: World) => {

      let added = false
      const { items } = inventory.data

      // stackable items
      if (item.components.item.stackable) {
        for (const slot of items) {
          if (slot && slot.length && slot[0].includes(item.components.item.name)) {
            slot.push(item.id)
            added = true
            break
          }
        }
      } else if (items.map(x => x?.[0]).includes(item.id)) {
        return
      }

      // non-stackable items
      if (!added) for (let i = 0; i < inventory.data.items.length; i++) {
        if (items[i] === undefined) {
          inventory.data.items[i] = [item.id]
          added = true
          break
        }
      }

      // add to world
      if (added && !world.entity(item.id)) {
        world.addEntity(item)
      }
    },
    setItem: (index: number, item: ItemEntity, world: World) => {
      inventory.data.items[index] = [item.id]
      if (!world.entity(item.id)) {
        world.addEntity(item)
      }
    },
    cleanup: (world: World) => {
      const { items } = inventory.data
      for (const slot of items) {
        if (!slot) continue
        for (const itemId of slot) {
          world.removeEntity(itemId)
        }
      }
    },
    removeItem: (itemId: string, world: World) => {
      const { items } = inventory.data

      for (let i = 0; i < items.length; i++) {
        const slot = items[i]
        if (!slot) continue

        const index = slot.indexOf(itemId)
        if (index !== -1) {
          slot.splice(index, 1)
          if (slot.length === 0) {
            items[i] = undefined
          }
          return
        }
      }

      world.removeEntity(itemId)
    },
    dropActiveItem: () => {
      const { items, activeItemIndex } = inventory.data

      const slot = items[activeItemIndex]
      if (!slot) return
      if (slot.length > 1) {
        slot.shift()
        return
      }
      items[activeItemIndex] = undefined
    },
    setActiveItemIndex: (index: number) => {
      inventory.data.activeItemIndex = index
    }
  }
  return inventory
}

export const InventorySystem: SystemBuilder<"InventorySystem"> = {
  id: "InventorySystem",
  init: (world) => ({
    id: "InventorySystem",
    query: ["position", "input", "actions", "inventory", "team", "collider"],
    priority: 5,
    onTick: (entities: Entity<Position | Collider | Input | Actions | Renderable | Inventory | Team>[]) => {
      entities.forEach(entity => {
        const { inventory } = entity.components

        // build items
        if (inventory.itemBuilders.length) {
          for (const [index, builder] of inventory.itemBuilders.entries()) {
            const item = builder({ character: entity })

            inventory.data.items[index] = [item.id]
            world.addEntity(item)
          }
          inventory.itemBuilders = []
        }

        for (let index = 0; index < inventory.data.items.length; index++) {
          const itemIds = inventory.data.items[index]
          if (!itemIds) continue

          for (const itemId of itemIds) {
            const itemEntity = world.entities[itemId] as ItemEntity

            if (!itemEntity) {
              inventory.data.items[index] = itemIds.filter(id => id !== itemId)
              if (inventory.data.items[index]?.length === 0) {
                inventory.data.items[index] = undefined
              }
            } else {
              // itemEntity.components.renderable.visible = false
              itemEntity.components.item.equipped = false
            }
          }
        }

        // update active item
        const activeItem = inventory.activeItem(world)
        if (activeItem) {
          // activeItem.components.renderable.visible = true
          activeItem.components.item.equipped = true
        }
      })
    }
  })
}
