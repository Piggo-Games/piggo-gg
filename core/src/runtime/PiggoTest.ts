import { DefaultWorld, GameTitle, PixiRenderer, ThreeRenderer } from "@piggo-gg/core"

export type PiggoTestProps = {
  game: GameTitle
  // assert: (gameState: unknown) => boolean
}

export type PiggoTest = (props: PiggoTestProps) => boolean

export const PiggoTest: PiggoTest = ({ game }) => {
  const world = DefaultWorld({ mode: "server" })
  world.flag = "red"
  world.setGame(game)

  for (let i = 0; i < 2; i += 1) {
    world.onTick({ force: true, isRollback: false })
  }

  return true
}

global.window = {
  innerWidth: 1920,
  innerHeight: 1080,
  // @ts-expect-error
  location: {
    origin: 'http://localhost'
  }
}

PiggoTest({ game: "mars" })
PiggoTest({ game: "island" })
PiggoTest({ game: "volley" })
PiggoTest({ game: "lobby" })
PiggoTest({ game: "build" })
