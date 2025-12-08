import { Collider, Debug, DudeSkin, Entity, Position, Renderable, Shadow, VolleyCharacterAnimations, VolleyCharacterDynamic } from "@piggo-gg/core"

export const BlueGuy = (): Entity => {

  const blueGuy = Entity({
    id: "blue-guy",
    components: {
      position: Position({ x: 140 }),
      debug: Debug(),
      collider: Collider ({
        shape: "ball", radius: 5, isStatic: true, group: "2"
      }),
      shadow: Shadow(5),
      renderable: Renderable({
        anchor: { x: 0.55, y: 0.9 },
        scale: -1.2,
        zIndex: 4,
        interpolate: true,
        scaleMode: "nearest",
        setup: DudeSkin("blue"),
        animationSelect: VolleyCharacterAnimations,
        onTick: VolleyCharacterDynamic
      })
    }
  })

  return blueGuy
}
