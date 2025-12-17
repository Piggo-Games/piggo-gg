import {
  Collider, Debug, Entity, Health, loadTexture,
  pixiAnimation, Position, Renderable, Shadow
} from "@piggo-gg/core"

export const Patrick = (): Entity => {

  const patrick = Entity<Health>({
    id: "patrick",
    components: {
      position: Position({ x: 140 }),
      debug: Debug(),
      collider: Collider({
        shape: "ellipse", radius: 7, length: 10, isStatic: true, group: "2"
      }),
      health: Health({ hp: 20, maxHp: 20 }),
      shadow: Shadow(9, 0, 1),
      renderable: Renderable({
        anchor: { x: 0.5, y: 0.9 },
        scale: 1.8,
        zIndex: 4,
        interpolate: true,
        scaleMode: "nearest",
        animationSelect: () => "idle",
        onTick: ({ world}) => {
          if (world.tick % 40 === 0) {
            patrick.components.health.data.hp -= 1
          }
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
