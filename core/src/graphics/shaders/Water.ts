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
        init: async (_, __, three) => {
          const geo = new SphereGeometry(500, 60, 40)

          mat = new ShaderMaterial({
            uniforms: {
              uTime: { value: 0.0 },
              uDensity: { value: 0.0015 },
              uBrightness: { value: 0.9 },
              uHorizon: { value: new Color(0x000044).toArray().slice(0, 3) },
              uZenith: { value: new Color(0x000000).toArray().slice(0, 3) },
              uCloudDensity: { value: 0.9 },
              uCloudSpeed: { value: 0.05 },
              uResolution: { value: { x: three.canvas?.width, y: three.canvas?.height } },
              uSunPos: { value: { x: 100, y: 200, z: 100 } }
            },
            vertexShader,
            fragmentShader,
            side: 1,
            depthWrite: false,
            depthTest: true,
            fog: false,
            toneMapped: true
          })

          const mesh = new Mesh(geo, mat)
          mesh.frustumCulled = false

          // sky.components.three.o.push(mesh)

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

          water.rotation.x = - Math.PI / 2
          water.position.y = -0.02

          sky.components.three.o.push(water)
        }
      })
    }
  })

  return sky
}

const vertexShader = /* glsl */`
  varying vec3 vWorldPosition;
  void main() {
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`

const fragmentShader = /* glsl */`

  uniform vec2 uResolution;
  uniform float uTime;

  varying vec3 vWorldPosition;

  #define PI 3.14159265359

  const vec3 SUN_POS = vec3(0.5, 0.5, 0.5);   // fixed sky location

  vec3 getSky(vec2 uv) {
    float atmosphere = sqrt(1.0-uv.y);
    vec3 skyColor = vec3(0.2, 0.4, 0.85);

    float scatter = pow(0.8, 1.0 / 15.0);
    scatter = 1.0 - clamp(scatter, 0.8, 1.0);

    vec3 scatterColor = mix(vec3(1.0), vec3(1.0, 0.3, 0.0) * 1.5, scatter);
    return mix(skyColor, scatterColor, atmosphere / 1.7);
  }

  vec3 getSun(vec3 dir) {
    float sun = max(dot(dir, SUN_POS), 0.0);

    float core = pow(sun, 100.0) * 900000.0;
    float glow = pow(sun, 10.0);

    float intensity = core + glow;

    return vec3(1.0, 0.6, 0.05) * intensity;
  }

  void main() {
    vec3 sunDir = normalize(vWorldPosition - cameraPosition + vec3(0.0, 150, 0.0));
    vec3 dir = normalize(vWorldPosition - cameraPosition);

    // float u = 0.5 + atan(dir.z, dir.x) / (2.0 * PI);
    float rawU = atan(dir.x, dir.z) / (2.0 * PI);
    float u = fract(rawU + 1.0);
    float v = dir.y * 0.5 + 0.5;
    vec2 uv = vec2(u, v);

    float horizon = smoothstep(-0.02, 0.0, dir.y);

    vec3 sky = getSky(uv);
    vec3 sun = getSun(sunDir);

    gl_FragColor = vec4(sun, 1.0);
  }
`
