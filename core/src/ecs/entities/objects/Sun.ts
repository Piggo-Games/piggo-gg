import { Bounds, colors, dayness, Entity, lerp, Position, Three } from "@piggo-gg/core"
import { DirectionalLight, HemisphereLight, Scene } from "three"

export type SunProps = {
  bounds?: Bounds
  pos?: { x: number; y: number; z: number }
}

export const Sun = (props: SunProps = {}) => {

  let light: DirectionalLight | undefined = undefined

  const sun = Entity<Three>({
    id: "sun",
    components: {
      position: Position(props.pos ?? { x: 200, y: 200, z: 100 }),
      three: Three({
        onTick: ({ client, world }) => {
          if (!light) return

          const dayFactor = dayness(world.tick, 0)

          light.color.set(lerp(colors.threeNight, colors.threeEvening, dayFactor))

          const pc = client.character()
          if (!pc) return

          const target = pc.components.three?.o[1] as Scene
          if (!target) return

          light.target = target
        },
        init: async ({ o }) => {
          light = new DirectionalLight(colors.evening, 7)

          light.shadow.normalBias = 0.02
          light.shadow.mapSize.set(2048 * 2, 2048 * 2)
          light.castShadow = true

          // widen the shadow
          light.shadow.camera.left = props.bounds?.left ?? -20
          light.shadow.camera.right = props.bounds?.right ?? 20
          light.shadow.camera.top = props.bounds?.top ?? 14
          light.shadow.camera.bottom = props.bounds?.bottom ?? -14

          light.position.set(200, 100, 200)
          if (props.pos) light.position.set(props.pos.x, props.pos.y, props.pos.z)

          const hemi = new HemisphereLight(0xaaaabb, colors.evening, 3)

          // const helper = new CameraHelper(light.shadow.camera)
          // o.push(helper)

          o.push(light, hemi)
        }
      })
    }
  })

  return sun
}
