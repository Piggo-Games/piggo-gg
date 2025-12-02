import { Entity, Networked, Position, Three } from "@piggo-gg/core"
import {
  BufferGeometry, DirectionalLight, Float32BufferAttribute,
  HemisphereLight, Mesh, MeshStandardMaterial
} from "three"

export const SurfRampDimensions = {
  length: 12,
  width: 6,
  height: 3
} as const

const RampGeometry = () => {
  const { length, width, height } = SurfRampDimensions

  const l = length / 2
  const w = width / 2
  const h = height

  // Triangular prism: ridge at y=h,z=0; edges at z=±w,y=0, extruded along x.
  const vertices = [
    -l, 0, -w,
    -l, h, 0,
    -l, 0, w,
    l, 0, -w,
    l, h, 0,
    l, 0, w
  ]

  const indices = [
    0, 1, 2, // back face
    3, 5, 4, // front face
    0, 3, 4, 0, 4, 1, // side 1
    1, 4, 5, 1, 5, 2, // top ridge to right edge
    2, 5, 3, 2, 3, 0  // side 2
  ]

  const geometry = new BufferGeometry()
  geometry.setIndex(indices)
  geometry.setAttribute("position", new Float32BufferAttribute(vertices, 3))
  geometry.computeVertexNormals()

  return geometry
}

export const SurfRamp = (): Entity<Position | Three> => {

  const ramp = Entity<Position | Three>({
    id: "surf-ramp",
    components: {
      position: Position({ x: 0, y: 0, z: 0 }),
      networked: Networked(),
      three: Three({
        init: async ({ o }) => {
          const mesh = new Mesh(
            RampGeometry(),
            new MeshStandardMaterial({
              color: 0x56c6ff,
              roughness: 0.35,
              metalness: 0.08
            })
          )

          mesh.castShadow = true
          mesh.receiveShadow = true

          const key = new DirectionalLight(0xffffff, 1.3)
          key.position.set(2, 4, 3)
          key.castShadow = true

          const hemi = new HemisphereLight(0xd7f0ff, 0x1b2735, 0.6)

          o.push(mesh, key, hemi)
        }
      })
    }
  })

  return ramp
}
