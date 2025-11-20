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
              uResolution: { value: { x: three.canvas?.width, y: three.canvas?.height } }
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

  #define iMouse vec2(500, 500)
  #define PI 3.14159265359

  vec3 getSky(vec2 uv) {
    float atmosphere = sqrt(1.0-uv.y);
    vec3 skyColor = vec3(0.2, 0.4, 0.8);
    
    float scatter = pow(iMouse.y / uResolution.y, 1.0 / 15.0);
    scatter = 1.0 - clamp(scatter, 0.8, 1.0);

    vec3 scatterColor = mix(vec3(1.0), vec3(1.0, 0.3, 0.0) * 1.5, scatter);
    return mix(skyColor, vec3(scatterColor), atmosphere / 1.3);
  }

  vec3 getSun(vec2 uv) {
    float sun = 1.0 - distance(uv,iMouse.xy / uResolution.y);
    sun = clamp(sun, 0.0, 1.0);

    float glow = sun;
    glow = clamp(glow, 0.0, 1.0);

    sun = pow(sun, 100.0);
    sun *= 100.0;
    sun = clamp(sun, 0.0, 1.0);

    glow = pow(glow, 6.0) * 1.0;
    glow = pow(glow, (uv.y));
    glow = clamp(glow, 0.0, 1.0);

    sun *= pow(dot(uv.y, uv.y), 1.0 / 1.65);

    glow *= pow(dot(uv.y, uv.y), 1.0 / 2.0);

    sun += glow;

    vec3 sunColor = vec3(1.0, 0.6, 0.05) * sun;

    return vec3(sunColor);
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / uResolution;

    vec3 sky = getSky(uv);
    vec3 sun = getSun(uv);

    gl_FragColor = vec4(sky + sun, 1.0);
  }
`
