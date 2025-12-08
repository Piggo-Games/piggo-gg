import { Collider, Debug, DudeSkin, Entity, loadTexture, pixiAnimation, Position, Renderable, Shadow, VolleyCharacterAnimations, VolleyCharacterDynamic } from "@piggo-gg/core"

export const BlueGuy = (): Entity => {

  const blueGuy = Entity({
    id: "blue-guy",
    components: {
      position: Position({ x: 140 }),
      debug: Debug(),
      collider: Collider({
        shape: "ball", radius: 10, isStatic: true, group: "2"
      }),
      shadow: Shadow(9, 0, -1),
      renderable: Renderable({
        anchor: { x: 0.55, y: 0.9 },
        scale: 1.8,
        zIndex: 4,
        interpolate: true,
        scaleMode: "nearest",
        animationSelect: () => "idle",
        setup: async (r) => {
          const t = await loadTexture("redstar.json")

          r.animations = {
            idle: pixiAnimation(
              [1, 2, 3, 4, 5, 6, 7, 8].map(i => t[`idle${i}`])
            )
          }
        }
      })
    }
  })

  return blueGuy
}
