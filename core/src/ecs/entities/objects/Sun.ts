import { Bounds, colors, Entity, Position, Three } from "@piggo-gg/core"
import { CameraHelper, DirectionalLight, HemisphereLight, Mesh, MeshPhysicalMaterial, Scene, SphereGeometry } from "three"

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
        onTick: ({ client }) => {
          if (!light) return

          const pc = client.character()
          if (!pc) return

          const target = pc.components.three?.o[1] as Scene
          if (!target) return

          light.target = target
          
        },
        init: async (o) => {
          // light = new DirectionalLight(colors.evening, 7)
          light = new DirectionalLight(colors.evening, 7)

          light.shadow.normalBias = 0.02
          light.shadow.mapSize.set(2048 * 2, 2048 * 2)
          light.castShadow = true

          // widen the shadow
          if (props.bounds) {
            light.shadow.camera.left = props.bounds.left
            light.shadow.camera.right = props.bounds.right
            light.shadow.camera.top = props.bounds.top
            light.shadow.camera.bottom = props.bounds.bottom
          }

          const sphere = new Mesh(
            new SphereGeometry(8, 32, 32),
            new MeshPhysicalMaterial({
              emissive: colors.night,
              emissiveIntensity: 1
            })
          )

          light.position.set(200, 100, 200)
          sphere.position.set(200, 100, 200)
          if (props.pos) light.position.set(props.pos.x, props.pos.y, props.pos.z)

          const hemi = new HemisphereLight(0xaaaabb, colors.evening, 3)

          const helper = new CameraHelper(light.shadow.camera)
          o.push(helper)

          o.push(light, hemi)
        }
      })
    }
  })

  return sun
}
