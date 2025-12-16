import {
  Collider, Debug, Entity, Health, loadTexture,
  pixiAnimation, Position, Renderable, Shadow
} from "@piggo-gg/core"

export const Patrick = (): Entity => {

  const patrick = Entity({
    id: "patrick",
    components: {
      position: Position({ x: 140 }),
      debug: Debug(),
      collider: Collider({
        shape: "ball", radius: 10, isStatic: true, group: "2"
      }),
      health: Health({ hp: 50, maxHp: 50 }),
      shadow: Shadow(9, 0, 1),
      renderable: Renderable({
        anchor: { x: 0.5, y: 0.9 },
        scale: 1.8,
        zIndex: 4,
        interpolate: true,
        scaleMode: "nearest",
        animationSelect: () => "idle",
        onTick: () => {
          patrick.components.health!.data.hp += 1
        },
        setup: async (r) => {
          const t = await loadTexture("patrick.json")

          r.animations = {
            idle: pixiAnimation(
              [1, 2, 3, 4, 5, 6, 7, 8].map(i => t[`idle${i}`])
            )
          }
        }
      })
    }
  })

  return patrick
}
