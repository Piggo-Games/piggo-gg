import { Entity, IslandState, loadTexture, Position, Renderable, Roll, values } from "@piggo-gg/core"
import { Sprite } from "pixi.js"

export const NumBoard = (): Entity => {

  let digits: Record<string, Sprite> = {}
  let rendered: number | null = null

  const displayNumber = (roll: Roll | null) => {
    // hide everything
    if (roll === null) {
      for (const digit of values(digits)) digit.visible = false
      return
    }

    const numStr = roll.toString()

    const chars = numStr.length

    let startX = chars === 1 ? 33 - 15.5 : 0

    // hide everything
    for (const digit of values(digits)) {
      digit.visible = false
    }

    // show needed digits
    for (let i = 0; i < numStr.length; i++) {
      let key = numStr[i]
      if (i === 1 && key === "1") {
        key = "eleven"
      }

      const sprite = digits[key]

      sprite.x = startX + i * 11 * 3 - 16
      sprite.y = 0
      sprite.visible = true
    }
  }

  const numBoard = Entity({
    id: "num-board",
    components: {
      position: Position({ x: 0, y: -83 }),
      renderable: Renderable({
        zIndex: 2,
        scaleMode: "nearest",
        anchor: { x: 0.5, y: 0.5 },
        onTick: ({ world }) => {
          const state = world.state<IslandState>()
          if (state.rolled !== rendered) {
            displayNumber(state.rolled)
            rendered = state.rolled
          }
        },
        setup: async (r) => {
          const board = await loadTexture("BoardGreen.json")
          const left = new Sprite(board["0"])
          const right = new Sprite(board["1"])
          left.anchor.set(0.5, 0.5)
          right.anchor.set(0.5, 0.5)
          left.texture.source.scaleMode = "nearest"
          right.texture.source.scaleMode = "nearest"
          left.x = -26.5
          right.x = 26.5
          r.c.addChild(left)
          r.c.addChild(right)

          const nums = await loadTexture("nums.json")

          for (let i of [0, 1, 1, 2, 3, 4, 5, 6, 7, 8, 9]) {
            let key = `${i}`
            if (i === 1 && digits[key]) {
              key = "eleven"
            }

            const sprite = new Sprite(nums[`${i}`])
            sprite.anchor.set(0.5, 0.5)
            sprite.scale.set(3)
            sprite.texture.source.scaleMode = "nearest"
            r.c.addChild(sprite)

            digits[key] = sprite
          }

          displayNumber(null)
        }
      })
    }
  })

  return numBoard
}
