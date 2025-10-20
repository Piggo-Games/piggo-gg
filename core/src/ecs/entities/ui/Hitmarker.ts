import { Entity, HtmlDiv, max, NPC, Position, Three } from "@piggo-gg/core"

export const Hitmarker = () => {
  let init = false

  const wrapper = HtmlDiv({
    position: "absolute",
    left: "50%",
    top: "50%",
    transform: "translate(-50%, -50%)"
  })

  const marker = (left: `${number}px`, top: `${number}px`, rotate: number) => HtmlDiv({
    position: "absolute",
    left,
    top,
    width: "10px",
    height: "2px",
    backgroundColor: "white",
    transform: `rotate(${rotate}deg)`
  })

  const topLeft = marker("-14px", "-10px", 45)
  const topRight = marker("4px", "-10px", -45)
  const bottomLeft = marker("-14px", "8px", -45)
  const bottomRight = marker("4px", "8px", 45)

  const markers = [topLeft, topRight, bottomLeft, bottomRight]

  const fadeRate = 0.07

  const hitmarker = Entity({
    id: "hitmarker",
    components: {
      position: Position(),
      npc: NPC({
        behavior: (_, world) => {
          if (!world.client || !world.three) return

          if (!init) {
            wrapper.append(topLeft, topRight, bottomLeft, bottomRight)
            world.three?.append(wrapper)
            init = true
          }
        }
      }),
      three: Three({
        onRender: ({ world, delta, client }) => {
          const ratio = delta / 25

          const { localHit } = client.controls

          const opacity = max(0, 1.2 - (world.tick - localHit.tick + ratio) * fadeRate)

          if (opacity === 0) localHit.tick = -100

          for (const m of markers) {
            m.style.opacity = String(opacity)
            m.style.backgroundColor = localHit.headshot ? "red" : "white"
            m.style.height = localHit.headshot ? "3px" : "2px"
          }
        }
      })
    }
  })

  return hitmarker
}
