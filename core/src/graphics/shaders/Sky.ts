import { dayness, Entity, Position, Three } from "@piggo-gg/core"
import { Color, Mesh, ShaderMaterial, SphereGeometry } from "three"

export const Sky = () => {

  let mesh: Mesh | undefined = undefined

  const sky = Entity<Three>({
    id: "sky",
    components: {
      position: Position(),
      three: Three({
        onRender: ({ delta, world, three }) => {
          if (mesh && world.game.id === "island") {
            const mat = mesh.material as ShaderMaterial

            mat.uniforms.uTime.value = world.tick + delta / 25
            mat.uniforms.uDay.value = dayness(world.tick, delta)

            mat.uniforms.uResolution.value = {
              x: three.canvas?.clientWidth || 1, y: three.canvas?.clientHeight || 1
            }
          }
        },
        init: async ({ o, three }) => {
          const geo = new SphereGeometry(500, 60, 40)

          const material = new ShaderMaterial({
            uniforms: {
              uTime: { value: 0.0 },
              uDay: { value: 0.0 },
              uDensity: { value: 0.0015 },
              uBrightness: { value: 0.9 },
              uHorizon: { value: new Color(0x000044).toArray().slice(0, 3) },
              uZenith: { value: new Color(0x000000).toArray().slice(0, 3) },
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

          mesh = new Mesh(geo, material)
          mesh.frustumCulled = false

          o.push(mesh)
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
  precision highp float;

  uniform float uTime;
  uniform float uDay;
  uniform float uDensity;
  uniform float uBrightness;
  uniform vec3  uHorizon;
  uniform vec3  uZenith;
  uniform vec2  uResolution;

  varying vec3 vWorldPosition;

  const float PI = 3.141592653589793;

  // -------------------- hash utils --------------------
  float hash12(vec2 p){
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
  }

  // -------------------- octahedral mapping --------------------
  vec2 octaProject(vec3 v){
    v = normalize(v);
    v /= (abs(v.x) + abs(v.y) + abs(v.z));
    vec2 uv = v.xz;
    if (v.y < 0.0) uv = (1.0 - abs(uv.yx)) * sign(uv);
    return uv * 0.5 + 0.5;
  }
  vec3 octaUnproject(vec2 e){
    e = e * 2.0 - 1.0;
    vec3 v = vec3(e.x, 1.0 - abs(e.x) - abs(e.y), e.y);
    float t = clamp(-v.y, 0.0, 1.0);
    v.x += v.x >= 0.0 ? -t :  t;
    v.z += v.z >= 0.0 ? -t :  t;
    return normalize(v);
  }

  // -------------------- SDF disc --------------------
  float starDiscAngular(vec3 dir, vec3 centerDir, float r){
    float ang = acos(clamp(dot(dir, centerDir), -1.0, 1.0));
    float core = 1.0 - smoothstep(r*0.55, r, ang);
    float halo = 1.0 - smoothstep(r, r*1.9, ang);
    return core + 0.35 * halo;
  }

  // -------------------- star stamp --------------------
  vec3 stampStar(vec3 dir, vec3 cDir, float baseR, float colorSeed){
    vec3 cool = vec3(0.8, 0.7, 1.00);
    vec3 warm = vec3(1.00, 1, 0.6);

    float t = smoothstep(0.15, 0.85, colorSeed);
    vec3 tint = mix(cool, warm, t);

    float m = starDiscAngular(dir, cDir, baseR);
    return tint * (m * uBrightness);
  }

  // -------------------- starfield --------------------

  mat2 R0 = mat2(0.949235, -0.314520, 0.314520,  0.949235);
  mat2 R1 = mat2(0.424864, -0.905261, 0.905261,  0.424864);
  mat2 R2 = mat2(-0.481558, -0.876414, 0.876414, -0.481558);
  mat2 RN0 = mat2(0.949235,  0.314520, -0.314520,  0.949235);
  mat2 RN1 = mat2(0.424864,  0.905261, -0.905261,  0.424864);
  mat2 RN2 = mat2(-0.481558,  0.876414, -0.876414, -0.481558);

  vec3 starLayers(vec3 dir, vec2 uv) {
    vec3 acc = vec3(0.0);

    for (int layer = 0; layer < 3; ++layer){
      float scale   = (layer==0) ? 420.0 : (layer==1) ? 1111.0 : 2777.0;
      float densMul = (layer==0) ? 0.55 : (layer==1) ? 0.35   : 0.18;
      float radius  = (layer==0) ? 0.0040: (layer==1)? 0.0024 : 0.0016;

      vec2 uvr = (layer==0) ? (uv * R0) : (layer==1) ? (uv * R1) : (uv * R2);

      vec2 g = uvr * scale;
      vec2 c0 = floor(g);

      int R = (layer == 0) ? 1 : 0;
      for (int j = -R; j <= R; ++j){
        for (int i = -R; i <= R; ++i){
          vec2 cell = c0 + vec2(float(i), float(j));

          float selSeed = hash12(cell + float(layer)*17.0);
          float threshold = 1.0 - clamp(uDensity * densMul, 0.0, 0.995);
          if (selSeed < threshold) continue;

          // independent seeds
          float colorSeed   = hash12(cell + 113.0 + float(layer)*7.0);
          float sizeSeed    = hash12(cell + 91.0  + float(layer)*7.0);

          vec2 centerUV = (cell * (layer==0 ? RN0 : layer==1 ? RN1 : RN2)) / scale;

          vec3 cDir = octaUnproject(centerUV);

          float r = radius * mix(0.7, 1.8, sizeSeed);
          acc += stampStar(dir, cDir, r, colorSeed);
        }
      }
    }
    return acc;
  }

  vec3 getSun(vec3 dir, vec3 sunDir) {
    float sun = max(dot(dir, sunDir), 0.0);

    float core = smoothstep(0.851, 1.0, sun);
    core *= core;

    return vec3(1.0, 0.8, 0.2) * (core * 5000.0);
  }

  float hash(vec2 p) {
    p = fract(p * 0.3183099 + vec2(0.1, 0.7));
    p *= 17.0;
    return fract(p.x * p.y * (p.x + p.y));
  }

  float fractal(float n) {
    return fract(sin(n) * 43758.5453123);
  }

  float noise(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);

    f = f*f*(3.0 - 2.0*f);

    float n = dot(i, vec3(1.0, 57.0, 113.0));

    return mix(
        mix(
            mix(fractal(n + 0.0),   fractal(n + 1.0),   f.x),
            mix(fractal(n + 57.0),  fractal(n + 58.0),  f.x),
            f.y
        ),
        mix(
            mix(fractal(n + 113.0), fractal(n + 114.0), f.x),
            mix(fractal(n + 170.0), fractal(n + 171.0), f.x),
            f.y
        ),
        f.z
    );
  }

  float fbm(vec3 p) {
      float f = 0.0;
      float a = 0.5;

      for (int i = 0; i < 5; i++) {
          f += a * noise(p);
          p = p * 2.0 + vec3(13.1, 7.2, 5.3);
          a *= 0.5;
      }

      return f;
  }

  vec3 getClouds(vec3 dir) {
    float h = clamp(dir.y / 1.1, 0.0, 1.0);

    float curtain = pow(h, 1.2) * exp(-h * 20.0);

    float v = fbm(vec3(
      dir.x * 8.0 + uTime * 0.003, h * 20.0, dir.z * 2.0 + uTime * 0.003
    ));

    float a = curtain * v;
    a = clamp(a, 0.0, 1.0);

    return vec3(a * 30.0);
  }

  mat3 rotateX(float a) {
    float s = sin(a), c = cos(a);
    return mat3(
        1.0, 0.0, 0.0,
        0.0,  c,  -s,
        0.0,  s,   c
    );
  }

  mat3 rotateY(float a) {
      float s = sin(a), c = cos(a);
      return mat3(
          c, 0.0, s,
          0.0, 1.0, 0.0,
          -s, 0.0, c
      );
  }

  void main() {
    vec3 dir = normalize(vWorldPosition - cameraPosition);

    float tilt = uTime * 0.0004;
    float tiltAngle = radians(50.5); 
    mat3 rotMat  = rotateY(tilt);
    mat3 tiltMat = rotateX(tiltAngle);
    vec3 vdir = (rotMat * tiltMat) * dir;

    if (cameraPosition.y < -0.1) {
      gl_FragColor = vec4(0.0, 0.0, 0.2 + dir.y * 0.3, 1.0);
      return;
    }

    // Horizon → Zenith gradient
    float horizon = smoothstep(-0.1, 0.9, dir.y);
    vec3 bg = mix(uHorizon, uZenith, horizon);

    float dayFactor = uDay;

    vec3 daySky = vec3(0.24, 0.6, 1.0);

    bg = mix(bg, daySky, dayFactor);

    vec2 uv = octaProject(vdir);

    vec3 sunDir = normalize(vWorldPosition - cameraPosition + vec3(0.0, 150, 0.0));
    vec3 sun = getSun(dir, vec3(0.5, 0.5, 0.5));
    float s = length(sun);

    sun *= dayFactor;
    sun += vec3(0.3, 0.3, 0.5) * s * (1.0 - dayFactor);

    vec3 clouds = getClouds(dir);

    vec3 color = clamp(bg * (1.0 - s / 1.5), 0.0, 1.0) + sun;

    if (dir.y > 0.01 && dayFactor < 0.95) {
      vec3 stars = starLayers(vdir, uv);
      stars *= clamp(0.9 - dayFactor - s, 0.0, 1.0);
      color += stars;
    }

    color += clouds;

    gl_FragColor = vec4(color, 1.0);
  }
`
