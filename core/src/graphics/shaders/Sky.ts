import { Entity, Position, Three } from "@piggo-gg/core"
import { Clock, Color, Mesh, ShaderMaterial, SphereGeometry } from "three"

export const Sky = () => {

  let mesh: Mesh | undefined = undefined

  const sky = Entity<Three>({
    id: "sky",
    components: {
      position: Position(),
      three: Three({
        onRender: ({ delta }) => {
          if (mesh) {
            const mat = mesh.material as ShaderMaterial

            mat.uniforms.uTime.value += delta / 1000
          }
        },
        init: async (o, _, __, three) => {
          const geo = new SphereGeometry(500, 60, 40)

          const material = new ShaderMaterial({
            uniforms: {
              uTime: { value: 0.0 },
              uDensity: { value: 0.0015 },
              uBrightness: { value: 0.9 },
              uHorizon: { value: new Color(0x000044).toArray().slice(0, 3) },
              uZenith: { value: new Color(0x000000).toArray().slice(0, 3) },
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

          mesh = new Mesh(geo, material)
          mesh.frustumCulled = false

          // const clock = new Clock()
          // const update = () => {
          //   material.uniforms.uTime.value = clock.getElapsedTime()
          // }

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
  uniform float uDensity;     // 0..1
  uniform float uBrightness;  // overall star brightness
  uniform vec3  uHorizon;
  uniform vec3  uZenith;
  uniform float uCloudSpeed;
  uniform vec2  uResolution;

  varying vec3 vWorldPosition;

  const float PI = 3.141592653589793;

  // -------------------- hash utils --------------------
  float hash12(vec2 p){
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
  }
  vec2 hash22(vec2 p){
    float n = hash12(p);
    float m = hash12(p + 19.19);
    return vec2(n, m);
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
  mat2 rot(float a){ float s=sin(a), c=cos(a); return mat2(c,-s,s,c); }

  vec3 starLayers(vec3 dir, vec2 uv) {
    vec3 acc = vec3(0.0);

    const int R = 1;
    for (int layer = 0; layer < 3; ++layer){
      float scale   = (layer==0) ? 420.0 : (layer==1) ? 1111.0 : 2777.0;
      float densMul = (layer==0) ? 0.55 : (layer==1) ? 0.35   : 0.18;
      float radius  = (layer==0) ? 0.0040: (layer==1)? 0.0024 : 0.0016;

      vec2 uvr = (layer==0) ? (uv * rot(0.32)) :
                (layer==1) ? (uv * rot(1.13)) :
                              (uv * rot(2.07));

      vec2 g = uvr * scale;
      vec2 c0 = floor(g);

      for (int j = -R; j <= R; ++j){
        for (int i = -R; i <= R; ++i){
          vec2 cell = c0 + vec2(float(i), float(j));

          float selSeed = hash12(cell + float(layer)*17.0);
          float threshold = 1.0 - clamp(uDensity * densMul, 0.0, 0.995);
          if (selSeed < threshold) continue;

          // independent seeds
          float colorSeed   = hash12(cell + 113.0 + float(layer)*7.0);
          float sizeSeed    = hash12(cell + 91.0  + float(layer)*5.0);

          vec2 r2 = hash22(cell + 7.0);
          vec2 centerUV = (cell + r2) / scale;
          centerUV = (layer==0) ? (centerUV * rot(-0.32)) :
                    (layer==1) ? (centerUV * rot(-1.13)) :
                                  (centerUV * rot(-2.07));

          vec3 cDir = octaUnproject(fract(centerUV));
          // if (dot(cDir, vec3(0.0, 1.0, 0.0)) <= 0.0) continue;

          float r = radius * mix(0.7, 1.8, sizeSeed);
          acc += stampStar(dir, cDir, r, colorSeed);
        }
      }
    }
    return acc;
  }

  // -------------------- simple noise from hash12 --------------------
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);

    // corners
    float a = hash12(i);
    float b = hash12(i + vec2(1.0, 0.0));
    float c = hash12(i + vec2(0.0, 1.0));
    float d = hash12(i + vec2(1.0, 1.0));

    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) +
          (c - a) * u.y * (1.0 - u.x) +
          (d - b) * u.x * u.y;
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

  float noise2(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);

    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));

    vec2 u = f * f * (3.0 - 2.0 * f);

    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
  }

  float cloudNoise(vec2 p) {
    float n = 0.0;

    n += noise2(p * 1.0) * 0.6;
    n += noise2(p * 2.0) * 0.3;
    n += noise2(p * 4.0) * 0.1;

    return n;
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

  // ---------- aurora color ramp ----------
  vec3 auroraPalette(float t) {
    t = clamp(t, 0.0, 1.0);

    // shift each channel differently to create green→pink→blue→purple
    float r = 0.5 + 0.5 * sin(6.2831 * (t + 0.00));
    float g = 0.5 + 0.5 * sin(6.2831 * (t + 0.33));
    float b = 0.5 + 0.5 * sin(6.2831 * (t + 0.66));

    vec3 c = vec3(r, g, b);

    // bias toward aurora-like hues
    c = pow(c, vec3(1.8, 1.2, 1.0)); // makes green/pink more pronounced

    return c;
}


  vec3 getAurora(vec3 dir) {
    float h = clamp(dir.y / 1.2, 0.0, 1.0);

    float curtain = pow(h, 1.2) * exp(-h * 20.0);

    float v = fbm(vec3(dir.x * 8.0, h * 20.0, dir.z * 2.0));

    float a = curtain * v;
    a = pow(a, 1.0);
    a = clamp(a, 0.0, 1.0);

    return vec3(a * 30.0);
  }


  vec3 getClouds(vec3 dir) {
    // no clouds below horizon
    if (dir.y <= 0.0) return vec3(0.0);

    // scale uv up
    // vec2 p = uv * 3.0;
    vec2 p = dir.xz * 3.0;
    // p *= vec2(2.0, 1.0);

    //  p += vec2(0.002, 0.005) * (uTime / 1000.0);

    // vec2 p = vec2(atan(dir.x, dir.z), dir.y);  
    // p *= 5.0;

    // layered noise
    // float n = cloudNoise(p);
    float n = cloudNoise(p + (uTime / 10.0) * 0.3);

    // soften into cloud shapes
    float c = smoothstep(0.5, 0.75, n);

    // fade near horizon
    c *= pow(dir.y, 0.7);
    return vec3(1.0) * c;
  }

  void main() {
    vec3 dir = normalize(vWorldPosition - cameraPosition);

    // Horizon → Zenith gradient
    float t = smoothstep(-0.1, 0.9, dir.y);
    vec3 bg = mix(uHorizon, uZenith, t);

    // ---------------- day/night blending ----------------
    // Define "day" between 6h and 18h
    float dayFactor = smoothstep(5.0, 8.0, uTime) * (1.0 - smoothstep(17.0, 20.0, uTime));
    dayFactor = 0.0;

    vec3 daySky = vec3(0.5, 0.75, 1.0);

    bg = mix(bg, daySky, dayFactor);

    vec2 uv = octaProject(dir);

    vec3 sunDir = normalize(vWorldPosition - cameraPosition + vec3(0.0, 150, 0.0));
    vec3 sun = getSun(dir, vec3(0.5, 0.5, 0.5));

    vec3 clouds = getAurora(dir);

    vec3 color = bg + sun;
    if (dir.y > 0.01) {
      vec3 stars = starLayers(dir, uv);
      stars *= (1.0 - dayFactor);
      color += stars;
    } else {
      color += vec3(0.0, 0.0, 0.1);
    }

    color += clouds;

    gl_FragColor = vec4(color, 1.0);
  }
`
