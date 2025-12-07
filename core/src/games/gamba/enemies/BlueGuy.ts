import { DudeSkin, Entity, Position, Renderable, VolleyCharacterAnimations, VolleyCharacterDynamic } from "@piggo-gg/core"

export const BlueGuy = (): Entity => {

  const redGuy = Entity({
    id: "blue-guy",
    components: {
      position: Position(),
      renderable: Renderable({
        anchor: { x: 0.55, y: 0.9 },
        scale: 1.2,
        zIndex: 4,
        interpolate: true,
        scaleMode: "nearest",
        setup: DudeSkin("blue"),
        animationSelect: VolleyCharacterAnimations,
        onTick: VolleyCharacterDynamic
      })
    }
  })

  return redGuy
}
