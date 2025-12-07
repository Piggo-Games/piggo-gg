import { Action, XY } from "@piggo-gg/core"

export const Move = Action<XY>("move", ({ params, entity }) => {
  if (!entity) return

  const { position } = entity.components
  if (!position) return

  if (params.x > 0) position.data.facing = 1
  if (params.x < 0) position.data.facing = -1

  position.setHeading({ x: NaN, y: NaN })
  position.setVelocity({
    ...((params.x !== undefined) ? { x: params.x } : {}),
    ...((params.y !== undefined) ? { y: params.y } : {})
  })
})
