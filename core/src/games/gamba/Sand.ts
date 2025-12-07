import { Entity, Position, Renderable, XY } from "@piggo-gg/core"

export const Sand = (pos: XY) => {

  const sand = Entity({
    id: `sand`,
    components: {
      position: Position(),
      renderable: Renderable({

      })
    }
  })

  return sand
}
