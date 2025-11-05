import { Entity, Position, Renderable } from "@piggo-gg/core"
import { Graphics } from "pixi.js"

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
        setContainer: async () => {
          const circle = new Graphics()
          circle.circle(0, 0, 4)
          circle.fill({ color: 0x00FFFF })

          return circle
        },
        zIndex: 12
      })
    }
  })

  return cursor
}
