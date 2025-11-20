import { Entity, Position, Three } from "@piggo-gg/core"
import { Color, Mesh, SphereGeometry, ShaderMaterial, Clock } from "three"

export const NewSky = () => {

  let clock = new Clock()

  let mat: ShaderMaterial | undefined = undefined

  const sky = Entity<Three>({
    id: "sky",
    components: {
      position: Position(),
      three: Three({
        onRender: () => {
          if (mat) {
            mat.uniforms.uTime.value = clock.getElapsedTime()
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

  // Gerstner wave
  vec3 gerstner(vec2 pos, float steep, float amp, float freq, vec2 dir, float t) {
      float phase = dot(pos, dir) * freq + t;
      float disp = sin(phase);

      // horizontal displacement (fake but good looking)
      vec2 horiz = dir * (steep * amp * cos(phase));

      return vec3(horiz, disp * amp);
  }

  // Multiple waves stacked
  vec3 getWaveDisplacement(vec2 pos, float t) {
      vec3 d = vec3(0.0);

      d += gerstner(pos, 0.4, 0.15, 1.5, normalize(vec2(1.0, 0.6)), t * 0.8);
      d += gerstner(pos, 0.25, 0.10, 2.1, normalize(vec2(-0.7, 1.0)), t * 1.1);
      d += gerstner(pos, 0.15, 0.05, 3.8, normalize(vec2(0.4, -1.0)), t * 1.4);

      return d;
  }

  // Compute surface normal from displaced height
  vec3 computeWaveNormal(vec2 pos, float t) {
      float eps = 0.05;

      float h  = getWaveDisplacement(pos, t).z;
      float hx = getWaveDisplacement(pos + vec2(eps, 0.0), t).z - h;
      float hy = getWaveDisplacement(pos + vec2(0.0, eps), t).z - h;

      vec3 n = normalize(vec3(-hx, 1.0, -hy));
      return n;
  }


  vec3 getWater(vec3 dir, vec2 skyUV) {
    // project to local water plane coords
    vec2 pos = skyUV * 40.0;   // scale controls wave size

    vec3 disp = getWaveDisplacement(pos, uTime);
    vec3 normal = computeWaveNormal(pos, uTime);

    // cheap lighting: sunlight approximation
    float nl = max(dot(normal, SUN_POS), 0.0);

    vec3 shallowColor = vec3(0.05, 0.12, 0.20);
    vec3 deepColor    = vec3(0.01, 0.04, 0.08);

    float depthMix = smoothstep(0.0, 1.0, disp.z + 0.3);

    vec3 color = mix(deepColor, shallowColor, depthMix);

    // add highlight from sun
    color += nl * vec3(1.0, 0.9, 0.5) * 0.5;

    return color;
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

    float rawU = atan(dir.x, dir.z) / (2.0 * PI);
    float u = fract(rawU + 1.0);

    float v = dir.y * 0.5 + 0.5;
    vec2 skyUV = vec2(u, v);

    float horizon = smoothstep(-0.02, 0.0, dir.y);

    vec3 sky = getSky(skyUV);
    vec3 sun = getSun(sunDir);

    vec3 water = getWater(dir, skyUV);

    vec3 color = mix(water, sky + sun, horizon);

    gl_FragColor = vec4(color, 1.0);
  }
`
