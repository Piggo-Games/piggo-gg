import { Command, GameTitle, InvokedAction } from "@piggo-gg/core"

type GameCommandParams = { game: string }
type GameCommandAction = InvokedAction<"game", GameCommandParams>

export const GameCommand: Command<GameCommandParams> = {
  id: "game",
  regex: /^\/game (\w+)/,
  prepare: () => ({ actionId: "game" }),
  parse: ({ world, match }): GameCommandAction | undefined => {
    const gameId = match[1] as GameTitle
    if (world.games[gameId] && world.game.id !== gameId) return {
      actionId: "game",
      params: { game: gameId }
    }
  },
  invoke: ({ params, world }) => {
    const gameId = params.game as GameTitle
    if (world.games[gameId] && world.game.id !== gameId) {
      world.setGame(gameId)
    }
  },
  cooldown: 0
}
