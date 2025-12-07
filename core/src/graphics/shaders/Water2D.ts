import { Entity, Position, Renderable } from "@piggo-gg/core"
import { Geometry, Mesh, Shader, Texture } from "pixi.js"

export const Water2D = (): Entity => {

  const geometry = new Geometry({
    // attributes: {

    // }
  })

  const water2D = Entity({
    id: `water2D`,
    components: {
      position: Position(),
      renderable: Renderable({
        setup: async (r) => {
          r.c = new Mesh({
            geometry,
            shader: Water2DShader(), 
            interactive: false,
            cullable: false,
            isRenderGroup: true,
          })
        }
      })
    }
  })

  return water2D
}

const vertexSrc = `
  precision mediump float;

  in vec2 aPosition;

  uniform vec2 uResolution;
  uniform vec2 uCamera;
  uniform float uZoom;

  out vec2 vWorldPos;

  void main() {
    vWorldPos = aPosition;

    vec2 screenPos = (aPosition - uCamera) * uZoom;
    vec2 clip = (screenPos / uResolution) * 2.0;
    clip.y *= -1.0;

    gl_Position = vec4(clip, 0.0, 1.0);
  }
`

const fragmentSrc = `
  precision mediump float;

  in vec2 vWorldPos;

  uniform sampler2D uNormalMap1;
  uniform sampler2D uNormalMap2;
  uniform float uTime;
  uniform float uDay;
  uniform float uNormalScale;
  uniform float uNormalStrength;
  uniform vec3 uDirToLight;
  uniform vec3 uLight;
  uniform vec2 uCamera;
  uniform float uFogNear;
  uniform float uFogFar;

  out vec4 fragColor;

  const vec2 VELOCITY_1 = vec2(0.1, 0.0);
  const vec2 VELOCITY_2 = vec2(0.0, 0.1);
  const float SPECULAR_SHARPNESS = 3.0;

  float pow2(float v) {
    return v * v;
  }

  vec3 sampleNormal(vec2 baseUv) {
    vec3 normal = texture(uNormalMap1, baseUv + VELOCITY_1 * uTime).xyz * 2.0 - 1.0;
    normal += texture(uNormalMap2, baseUv + VELOCITY_2 * uTime).xyz * 2.0 - 1.0;
    normal *= uNormalStrength;
    normal += vec3(0.0, 0.0, 1.0);
    return normalize(normal).xzy;
  }

  void main() {
    vec2 flowUv = vWorldPos * uNormalScale;
    vec3 normal = sampleNormal(flowUv);

    vec3 viewDir = normalize(vec3(0.0, 0.35, 1.0));
    vec3 lightDir = normalize(uDirToLight);

    vec3 halfDir = normalize(lightDir + viewDir);
    float specular = max(0.0, dot(normal, halfDir));
    specular = pow(specular, SPECULAR_SHARPNESS);

    float reflectivity = pow2(1.0 - max(0.0, dot(-viewDir, normal)));
    float diffuse = max(dot(normal, lightDir), 0.0);

    vec3 blue = vec3(0.1, 0.2, 0.45) + vec3(0.2, 0.25, 0.5) * uDay;
    vec3 sunColor = mix(vec3(0.3, 0.3, 0.5), vec3(0.7, 0.4, 0.1), uDay);

    vec3 surface = reflectivity * blue;
    surface += sunColor * specular * specular;
    surface -= vec3(0.07) * specular * specular;
    surface += sunColor * diffuse * 0.2;

    float dist = length(vWorldPos - uCamera);
    float fog = smoothstep(uFogNear, uFogFar, dist);
    surface = mix(surface, surface * 0.8, fog);

    fragColor = vec4(surface * uLight, clamp(max(reflectivity, specular), 0.0, 1.0));
  }
`

export type Water2DShaderProps = {
  normalMap1?: Texture
  normalMap2?: Texture
  resolution?: [number, number]
}

export const Water2DShader = (props: Water2DShaderProps = {}): Shader => {
  const normalMap1 = props.normalMap1 ?? Texture.from("waterNormal1.png")
  const normalMap2 = props.normalMap2 ?? Texture.from("waterNormal2.png")

  normalMap1.source.addressMode = "repeat"
  normalMap2.source.addressMode = "repeat"

  const shader = Shader.from({
    gl: {
      vertex: vertexSrc,
      fragment: fragmentSrc
    },
    resources: {
      uniforms: {
        uCamera: { value: [0, 0], type: "vec2<f32>" },
        uResolution: { value: props.resolution ?? [window.innerWidth, window.innerHeight], type: "vec2<f32>" },
        uZoom: { value: 1.0, type: "f32" },
        uTime: { value: 0, type: "f32" },
        uDay: { value: 1, type: "f32" },
        uNormalMap1: { value: normalMap1, type: "sampler2D" },
        uNormalMap2: { value: normalMap2, type: "sampler2D" },
        uNormalScale: { value: 0.1, type: "f32" },
        uNormalStrength: { value: 1.0, type: "f32" },
        uDirToLight: { value: [1, 0, 1], type: "vec3<f32>" },
        uLight: { value: [1, 1, 1], type: "vec3<f32>" },
        uFogNear: { value: 5.0, type: "f32" },
        uFogFar: { value: 50.0, type: "f32" }
      }
    }
  })

  // @ts-expect-error
  shader.glProgram.vertex = "#version 300 es\n" + vertexSrc
  // @ts-expect-error
  shader.glProgram.fragment = "#version 300 es\n" + fragmentSrc

  return shader
}
