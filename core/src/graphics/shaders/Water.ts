import { Entity, Position, Three } from "@piggo-gg/core"
import {
  Color, Mesh, SphereGeometry, ShaderMaterial, PlaneGeometry,
  TextureLoader, RepeatWrapping, Vector3
} from "three"
import { Water as ThreeWater } from "three/examples/jsm/objects/Water.js"

export const Water = () => {

  let mat: ShaderMaterial | undefined = undefined
  let water: ThreeWater | undefined = undefined

  const sky = Entity<Three>({
    id: "new-sky",
    components: {
      position: Position(),
      three: Three({
        onRender: ({ delta }) => {
          if (water) {
            water.material.uniforms['time'].value += delta / 25 * 0.002
          }
        },
        init: async () => {
          const waterGeo = new PlaneGeometry(10000, 10000)

          water = new ThreeWater(waterGeo, {
            textureWidth: 1024,
            textureHeight: 1024,
            waterNormals: new TextureLoader().load('waternormals.jpg', function (texture) {
              texture.wrapS = RepeatWrapping
              texture.wrapT = RepeatWrapping
            }),
            sunDirection: new Vector3(1, 0.2, 1),
            sunColor: 0x000000,
            waterColor: 0x001e9f,
            distortionScale: 2,
            clipBias: 0.003,
            side: 2
          })

          water.frustumCulled = false

          water.rotation.x = - Math.PI / 2
          water.position.y = -0.02

          sky.components.three.o.push(water)
        }
      })
    }
  })

  return sky
}
