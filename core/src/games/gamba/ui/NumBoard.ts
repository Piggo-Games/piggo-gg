import { Entity, GambaState, loadTexture, Position, Renderable, values } from "@piggo-gg/core"
import { Sprite } from "pixi.js"

export const NumBoard = (): Entity => {

  let digits: Record<string, Sprite> = {}
  let rendered = 0

  const displayNumber = (num: number) => {
    const numStr = num.toString()

    const chars = numStr.length

    let startX = chars === 1 ? 11 : 0

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
      console.log("showing", key, sprite)

      sprite.x = startX + i * 11 * 3
      sprite.y = 0
      sprite.visible = true
    }
  }

  const numBoard = Entity({
    id: "num-board",
    components: {
      position: Position({ x: 0, y: -140 }),
      renderable: Renderable({
        zIndex: 5,
        scaleMode: "nearest",
        onTick: ({ world }) => {
          const state = world.state<GambaState>()
          if (state.rolled !== null && state.rolled !== rendered) {
            displayNumber(state.rolled)
            rendered = state.rolled
          }
        },
        setup: async (r) => {
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
            // digits.push(sprite)
            digits[key] = sprite
          }

          displayNumber(11)
          console.log("NumBoard set up")
        }
      })
    }
  })

  return numBoard
}
