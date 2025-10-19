import { World, InvokedAction, Action, ClientSystemBuilder, values } from "@piggo-gg/core"

export type Command<T extends {} = {}> = Action<T> & {
  regex: RegExp
  parse: (_: { world: World, match: RegExpMatchArray }) => InvokedAction | undefined
}

export const CommandSystem = ClientSystemBuilder({
  id: "CommandSystem",
  init: (world) => {

    const processMessage = (message: string) => {
      values(world.commands).forEach(({ regex, parse }) => {
        const match = message.match(regex)
        if (match) {
          const action = parse({ world, match })
          if (action) {
            if (!world.client?.isLeader()) return

            world.actions.push(world.tick + 1, "world", action)
          }
        }
      })
    }

    return {
      id: "CommandSystem",
      query: [],
      priority: 6,
      onTick: () => {
        const messagesFromPlayer = world.messages.atTick(world.tick)
        if (messagesFromPlayer) {
          values(messagesFromPlayer).forEach((messages) => messages.forEach((message) => {
            processMessage(message)
          }))
        }
      }
    }
  }
})
