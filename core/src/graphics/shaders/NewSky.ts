import { Entity, Position, Three } from "@piggo-gg/core"
import { Color, Mesh, SphereGeometry, ShaderMaterial } from "three"

export const NewSky = () => {
  const sky = Entity<Three>({
    id: "sky",
    components: {
      position: Position(),
      three: Three({
        init: async (_, __, three) => {
          const geo = new SphereGeometry(500, 60, 40)

          const material = new ShaderMaterial({
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

          const mesh = new Mesh(geo, material)
          mesh.frustumCulled = false

          // const clock = new Clock()
          // const update = () => {
          //   material.uniforms.uTime.value = clock.getElapsedTime()
          // }

          sky.components.three.o.push(mesh)
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
      // world direction
      vec3 dir = normalize(vWorldPosition - cameraPosition + vec3(0.0, 150, 0.0));

      // convert to stable sky UV
      // float u = atan(dir.x, dir.z) / (2.0 * PI) + 0.5;
      float rawU = atan(dir.x, dir.z) / (2.0 * PI);
      float u = fract(rawU + 1.0);   // ensures wrap is seamless 0→1

      float v = dir.y * 0.5 + 0.5;
      vec2 skyUV = vec2(u, v);

      vec3 sky = getSky(skyUV);
      vec3 sun = getSun(dir);

      gl_FragColor = vec4(sky + sun, 1.0);
  }

`
