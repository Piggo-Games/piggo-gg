import { Action, Actions, Character, Effects, Entity, Input, Item, ItemComponents, Networked, Position } from "@piggo-gg/core"

export const DaggerItem = ({ character }: { character: Character }) => {


  const item = Entity<ItemComponents>({
    id: `dagger-${character.id}`,
    components: {
      position: Position(),
      effects: Effects(),
      networked: Networked(),
      item: Item({ name: "dagger", stackable: false }),
      input: Input({
        press: {
          "mb1": ({ character, world, aim, client }) => {
            console.log("Dagger MB1")
          }
        }
      }),
      actions: Actions({
        swing: Action("swing", ({ world, params }) => {

        })
      })
    }
  })

  return item
}
