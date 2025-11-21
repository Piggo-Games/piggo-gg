import { Entity, Position, Three } from "@piggo-gg/core"
import { PlaneGeometry, TextureLoader, RepeatWrapping, Vector3 } from "three"
import { Water as ThreeWater } from "three/examples/jsm/objects/Water.js"

export const Water = () => {

  let water: ThreeWater | undefined = undefined

  const sky = Entity<Three>({
    id: "new-sky",
    components: {
      position: Position(),
      three: Three({
        onRender: ({ delta }) => {
          if (water) {
            water.material.uniforms['time'].value += delta / 25 * 0.0016
          }
        },
        init: async (o) => {
          const waterGeo = new PlaneGeometry(10000, 10000)

          water = new ThreeWater(waterGeo, {
            textureWidth: 512,
            textureHeight: 512,
            waterNormals: new TextureLoader().load('waternormals.jpg', function (texture) {
              texture.wrapS = RepeatWrapping
              texture.wrapT = RepeatWrapping
            }),
            sunDirection: new Vector3(2, 0.4, 1),
            sunColor: 0xffffff,
            waterColor: 0x1122a0,
            distortionScale: 2,
            clipBias: 0.003,
            side: 2
          })

          water.frustumCulled = false

          water.rotation.x = - Math.PI / 2
          water.position.y = -0.4

          o.push(water)
        }
      })
    }
  })

  return sky
}
