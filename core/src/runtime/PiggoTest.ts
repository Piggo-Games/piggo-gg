import { DefaultWorld, GameTitle } from "@piggo-gg/core"

export type PiggoTest = (game: GameTitle) => boolean

export const PiggoTest: PiggoTest = (game) => {
  const world = DefaultWorld({ mode: "server" })
  world.flag = "red"
  world.setGame(game)

  for (let i = 0; i < 2; i += 1) {
    world.onTick({ force: true, isRollback: false })
  }

  return true
}

PiggoTest("mars")
PiggoTest("island")
PiggoTest("volley")
PiggoTest("lobby")
PiggoTest("build")
