import { Entity, pixiCircle, Position, Renderable } from "@piggo-gg/core"
import { DropShadowFilter } from "pixi-filters"

export const Cursor = (): Entity => {

  const cursor = Entity<Renderable | Position>({
    id: "cursor",
    components: {
      position: Position({ x: 2000, y: 2000, screenFixed: true }),
      renderable: Renderable({
        interpolate: true,
        onRender: ({ client, renderable }) => {
          renderable.visible = client.menu ? false : true

          document.body.style.cursor = client.menu ? "auto" : "none"
          document.documentElement.style.cursor = client.menu ? "auto" : "none"

          const { x, y } = client.controls.mouseScreen
          cursor.components.position.data.x = x
          cursor.components.position.data.y = y
        },
        setup: async (r) => {
          const circle = pixiCircle({ x: 0, y: 0, r: 4, style: { color: 0x00ffff, alpha: 1 } })
          r.c = circle

          const dropShadow = new DropShadowFilter({ blur: 0, offset: { x: 1, y: 1 } })
          r.c.filters = [dropShadow]
        },
        zIndex: 12
      })
    }
  })

  return cursor
}
