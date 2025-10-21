import { Action, ItemEntity } from "@piggo-gg/core"

export const setActiveItemIndex = Action<{ index: number | "up" | "down" }>("setActiveItemIndex", ({ params, entity }) => {
  if (params.index === null || params.index === undefined) return

  const inventory = entity?.components.inventory
  if (!inventory) return

  const { activeItemIndex } = inventory.data

  if (params.index === "up") {
    const index = activeItemIndex + 1
    inventory.setActiveItemIndex(index > 6 ? 0 : index)
  } else if (params.index === "down") {
    const index = activeItemIndex - 1
    inventory.setActiveItemIndex(index < 0 ? 6 : index)
  } else {
    inventory.setActiveItemIndex(params.index)
  }
})

export const pickupItem = Action("pickupItem", ({ player, entity, world }) => {
  if (!entity) return

  const character = player?.components.controlling.getCharacter(world)
  if (!character) return

  const { inventory } = character.components
  if (!inventory) return

  const { position, actions, effects, item, collider, renderable } = entity.components
  if (!position || !actions || !effects || !item) return

  if (!item.dropped) return

  item.dropped = false

  position.data.follows = character.id
  position.setRotation(0)

  if (renderable) renderable.visible = false

  // if (clickable) clickable.active = false
  if (collider) collider.active = false

  inventory.addItem(entity as ItemEntity, world)

  world.client?.sound.play({ name: "bubble" })
})

export const dropItem = Action("dropItem", ({ world, entity }) => {
  if (!entity) return

  const { inventory } = entity.components
  if (!inventory) return

  const activeItem = inventory.activeItem(world)
  if (!activeItem) return

  const { item, position, collider } = activeItem.components

  item.dropped = true
  position.data.follows = undefined
  position.setVelocity({ x: 0, y: 0 })

  // if (clickable) clickable.active = true
  if (collider) collider.active = true

  inventory.dropActiveItem()
}, 10)
