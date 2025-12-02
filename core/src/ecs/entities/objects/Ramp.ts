import { Entity, Networked, Position, Three } from "@piggo-gg/core"
import { BoxGeometry, DirectionalLight, HemisphereLight, Mesh, MeshStandardMaterial } from "three"

export const SurfRamp = (): Entity<Position | Three> => {

  const ramp = Entity<Position | Three>({
    id: "surf-ramp",
    components: {
      position: Position({ x: 0, y: 0, z: 0 }),
      networked: Networked(),
      three: Three({
        init: async ({ o }) => {
          const geometry = new BoxGeometry(4, 0.4, 6)
          geometry.rotateX(-Math.PI / 7)

          const material = new MeshStandardMaterial({
            color: 0x56c6ff,
            roughness: 0.3,
            metalness: 0.1
          })

          const mesh = new Mesh(geometry, material)
          mesh.position.set(0, 0, 0)
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
