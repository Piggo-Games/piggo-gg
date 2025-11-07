import { Entity, pixiCircle, Position, Renderable } from "@piggo-gg/core"

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
          return pixiCircle({ x: 0, y: 0, r: 4, style: { color: 0x00ffff, alpha: 1 } })
        },
        zIndex: 12
      })
    }
  })

  return cursor
}
