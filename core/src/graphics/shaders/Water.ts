import { Entity, hour, max, min, Position, Three } from "@piggo-gg/core"
import { RepeatWrapping, Vector3, Mesh, BufferGeometry, BufferAttribute, ShaderMaterial, UniformsLib } from "three"

export const Water = () => {

  let surface: Mesh<BufferGeometry, ShaderMaterial> | undefined = undefined

  const sky = Entity<Three>({
    id: "new-sky",
    components: {
      position: Position(),
      three: Three({
        onRender: ({ delta, client, world }) => {
          if (surface) {
            const mat = surface.material as ShaderMaterial

            mat.uniforms.uTime.value += delta / 2000
            mat.uniforms.uHour.value = hour(world.tick, delta)

            const pc = client.character()
            if (!pc) return

            let z = pc.components.position.data.z + 0.0

            // adjust the water height
            if (z > 0.3) {
              z -= 0.3
              surface.position.y = -min(z / 4, 0.7)
            } else if (z < -0.51) {
              z += 0.51
              surface.position.y = max(z / 4, -1)
            } else {
              surface.position.y = 0
            }
          }
        },
        init: async (o, _, __, three) => {
          surface = new Mesh()

          const halfSize = 1500
          const surfaceY = -0.06

          const surfaceVertices = new Float32Array([
            -halfSize, surfaceY, -halfSize,
            halfSize, surfaceY, -halfSize,
            -halfSize, surfaceY, halfSize,
            halfSize, surfaceY, halfSize
          ]);

          const surfaceIndices = [
            2, 3, 0,
            3, 1, 0
          ]

          const surfaceGeometry = new BufferGeometry()
          surfaceGeometry.setAttribute("position", new BufferAttribute(surfaceVertices, 3))
          surfaceGeometry.setIndex(surfaceIndices)

          surface.geometry = surfaceGeometry

          const surfaceMat = new ShaderMaterial({
            vertexShader: surfaceVertex,
            fragmentShader: surfaceFragment,
            side: 2,
            lights: true,
            uniforms: {
              ...UniformsLib.lights,
              uNormalMap1: { value: null },
              uNormalMap2: { value: null },
              uDirToLight: { value: new Vector3(1.0, 0.0, 1.0).normalize() },
              uTime: { value: 0 },
              uHour: { value: 0 },
              uLight: { value: new Vector3(0.5, 0.5, 0.5) }
            }
          })

          three.tLoader.loadAsync("waterNormal1.png").then((t) => {
            t.wrapS = RepeatWrapping
            t.wrapT = RepeatWrapping
            surfaceMat.uniforms.uNormalMap1.value = t
          })

          three.tLoader.loadAsync("waterNormal2.png").then((t) => {
            t.wrapS = RepeatWrapping
            t.wrapT = RepeatWrapping
            surfaceMat.uniforms.uNormalMap2.value = t
          })

          surface.material = surfaceMat;

          o.push(surface)
        }
      })
    }
  })

  return sky
}


export const surfaceVertex = /*glsl*/`
  uniform mat4 directionalShadowMatrix[NUM_DIR_LIGHT_SHADOWS];
  varying vec4 vDirectionalShadowCoord[NUM_DIR_LIGHT_SHADOWS];

  struct DirectionalLightShadow{
    float shadowIntensity;
    float shadowBias;
    float shadowNormalBias;
    float shadowRadius;
    vec2 shadowMapSize;
  };

  uniform DirectionalLightShadow directionalLightShadows[NUM_DIR_LIGHT_SHADOWS];

  varying vec2 _worldPos;
  varying vec2 _uv;

  void main()
  {
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    _worldPos = worldPos.xz;
    _uv = _worldPos * 0.1; // NORMAL_MAP_SCALE
    gl_Position = projectionMatrix * viewMatrix * worldPos;

    for(int i=0; i<NUM_DIR_LIGHT_SHADOWS; i++){
      vDirectionalShadowCoord[i] = directionalShadowMatrix[i] * vec4(position, 1.0);
    }
  }
`;

export const surfaceFragment = /*glsl*/`

  uniform mat4 directionalShadowMatrix[NUM_DIR_LIGHT_SHADOWS];
  const float UnpackDownscale=255./256.; // 0..1 -> fraction (excluding 1)
  const vec4 PackFactors=vec4(1.0,256.0,256.0*256.0,256.0*256.0*256.0);
  const vec4 UnpackFactors4=vec4(UnpackDownscale/PackFactors.rgb,1.0/PackFactors.a);
  float unpackRGBAToDepth(const in vec4 v){ return dot(v,UnpackFactors4); }
  vec2 unpackRGBATo2Half(const in vec4 v){ return vec2(v.x+(v.y/255.0),v.z+(v.w/255.0)); }


  // SHADOWMAP_PARS_FRAGMENT

  struct DirectionalLightShadow{
    float shadowIntensity;
    float shadowBias;
    float shadowNormalBias;
    float shadowRadius;
    vec2 shadowMapSize;
  };

  uniform DirectionalLightShadow directionalLightShadows[NUM_DIR_LIGHT_SHADOWS];
  uniform sampler2D directionalShadowMap[NUM_DIR_LIGHT_SHADOWS];
  varying vec4 vDirectionalShadowCoord[NUM_DIR_LIGHT_SHADOWS];

  float texture2DCompare(sampler2D depths, vec2 uv, float compare) {

    float texelSize = 1.0 / 4096.0;

    const int dist = 2;

    // 45° rotation (texture-aligned)
    mat2 rot = mat2(0.7071, -0.7071, 0.7071,  0.7071);

    float result = 0.0;
    float count = 0.0;

    for (int x = -dist; x <= dist; x++) {
      for (int y = -dist; y <= dist; y++) {
        vec2 offset = rot * vec2(x, y) * texelSize;

        float depth = unpackRGBAToDepth(texture2D(depths, uv + offset));
        result += step(compare, depth);
        count += 1.0;
      }
    }

    return result / count;
  }


  vec2 texture2DDistribution(sampler2D shadow,vec2 uv){
    return unpackRGBATo2Half(texture2D(shadow,uv));
  }

  float VSMShadow(sampler2D shadow,vec2 uv,float compare) {
    float occlusion = 1.0;
    vec2 distribution=texture2DDistribution(shadow,uv);
    float hard_shadow=step(compare,distribution.x); // Hard Shadow
    if(hard_shadow!=1.0){
    float distance=compare-distribution.x ;
    float variance=max(0.00000,distribution.y*distribution.y);
    float softness_probability=variance/(variance+distance*distance); // Chebeyshevs inequality
    softness_probability=clamp((softness_probability-0.3)/(0.95-0.3),0.0,1.0); // 0.3 reduces light bleed
    occlusion=clamp(max(hard_shadow,softness_probability),0.0,1.0);
    }
    return occlusion;
  }

  float getShadow(sampler2D shadowMap,vec2 shadowMapSize,float shadowIntensity,float shadowBias,float shadowRadius,vec4 shadowCoord) {
    float shadow = 1.0;
    shadowCoord.xyz /= shadowCoord.w;
    shadowCoord.z += shadowBias;

    bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
    bool frustumTest = inFrustum && shadowCoord.z <= 1.0;

    if (frustumTest) {
      #if defined(SHADOWMAP_TYPE_VSM)
      shadow = VSMShadow(shadowMap, shadowCoord.xy, shadowCoord.z);
      #else // no percentage-closer filtering:
      shadow = texture2DCompare(shadowMap, shadowCoord.xy, shadowCoord.z);
      #endif
    }

    return mix(1.0, shadow, shadowIntensity);
  }


  vec2 cubeToUV(vec3 v,float texelSizeY) {
    vec3 absV = abs(v);
    float scaleToCube = 1.0/max(absV.x,max(absV.y,absV.z));
    absV *= scaleToCube;
    v*=scaleToCube*(1.0-2.0*texelSizeY);
    vec2 planar=v.xy;
    float almostATexel=1.5*texelSizeY;
    float almostOne=1.0-almostATexel;
    if(absV.z>=almostOne){
    if(v.z>0.0)
    planar.x=4.0-v.x;
    }else if(absV.x>=almostOne){
    float signX=sign(v.x);
    planar.x=v.z*signX+2.0*signX;
    }else if(absV.y>=almostOne){
    float signY=sign(v.y);
    planar.x=v.x+2.0*signY+2.0;
    planar.y=v.z*signY-2.0;
    }
    return vec2(0.125,0.25)*planar+vec2(0.375,0.75);
  }

  float getPointShadow(sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar) {
    float shadow=1.0;
    vec3 lightToPosition=shadowCoord.xyz;
    float lightToPositionLength=length(lightToPosition);
    if(lightToPositionLength-shadowCameraFar<=0.0 && lightToPositionLength-shadowCameraNear>=0.0){
    float dp=(lightToPositionLength-shadowCameraNear)/(shadowCameraFar-shadowCameraNear);
    dp+=shadowBias;
    vec3 bd3D=normalize(lightToPosition);
    vec2 texelSize=vec2(1.0)/(shadowMapSize*vec2(4.0,2.0));
    shadow=texture2DCompare(shadowMap,cubeToUV(bd3D,texelSize.y),dp);
    }
    return mix(1.0,shadow,shadowIntensity);
  }

  // SHADOWMASK_PARS_FRAGMENT

  float getShadowMask() {
    float shadow = 1.0;
    DirectionalLightShadow directionalLight;

    #pragma unroll_loop_start
    for (int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i++) {
      directionalLight = directionalLightShadows[i];
      shadow *= getShadow(directionalShadowMap[i], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[i]);
    }
    #pragma unroll_loop_end

    return shadow;
  }

  varying vec2 _worldPos;
  varying vec2 _uv;

  const float NORMAL_MAP_SCALE = 0.01;
  const float NORMAL_MAP_STRENGTH = 1.0;
  const vec2 VELOCITY_1 = vec2(0.1, 0.0);
  const vec2 VELOCITY_2 = vec2(0.0, 0.1);
  const float SPECULAR_SHARPNESS = 5.0;
  const float MAX_VIEW_DEPTH = 100.0;
  const float DENSITY = 0.35;
  const float MAX_VIEW_DEPTH_DENSITY = MAX_VIEW_DEPTH * DENSITY;
  const vec3 ABSORPTION = vec3(1.0) / vec3(10.0, 40.0, 100.0);
  const float CRITICAL_ANGLE = asin(1.0 / 1.33) / 1.5708;
  const float FOG_DISTANCE = 1000.0;

  uniform float uTime;
  uniform float uHour;
  uniform sampler2D uNormalMap1;
  uniform sampler2D uNormalMap2;
  uniform vec3 uLight;

  uniform vec3 uDirToLight;

  float pow2(float v) {
    return v * v;
  }

  void main() {
    vec3 viewVec = vec3(_worldPos.x, 0.0, _worldPos.y) - cameraPosition;
    float viewLen = length(viewVec) * 0.992;
    vec3 viewDir = viewVec / viewLen + vec3(0.0, -0.08, 0.0);

    // float dayFactor = 1.0;
    float dayFactor = smoothstep(5.0, 8.0, uHour) * (1.0 - smoothstep(17.0, 20.0, uHour));

    vec3 normal = texture2D(uNormalMap1, _uv + VELOCITY_1 * uTime).xyz * 2.0 - 1.0;
    normal += texture2D(uNormalMap2, _uv + VELOCITY_2 * uTime).xyz * 2.0 - 1.0;
    normal *= NORMAL_MAP_STRENGTH;
    normal += vec3(0.0, 0.0, 1.0);
    normal = normalize(normal).xzy;

    if (cameraPosition.y > 0.0) {
      float shadow = getShadowMask();

      vec3 halfWayDir = normalize(uDirToLight - viewDir) + vec3(0.0, 0.22, 0.0);
      float specular = max(0.0, dot(normal, halfWayDir));
      specular = pow(specular, SPECULAR_SHARPNESS);
      specular *= max(shadow, 0.4);

      float reflectivity = pow2(1.0 - max(0.0, dot(-viewDir, normal)));

      // vec3 reflection = sampleSkybox(reflect(viewDir, normal));
      vec3 blue = vec3(0.15, 0.15, 0.4) + vec3(0.2, 0.25, 0.5) * dayFactor;
      vec3 surface = reflectivity * blue;

      surface += vec3(0.8, 0.4, 0.1) * specular * specular;
      surface -= vec3(0.0, 0.0, 0.1) * specular * specular;

      vec4 final = vec4(surface, max(reflectivity, specular));

      gl_FragColor = final;
      gl_FragColor.rgb *= max(shadow, 0.4);
      return;
    }

    float originY = cameraPosition.y;
    viewLen = min(viewLen, MAX_VIEW_DEPTH);
    float sampleY = originY + viewDir.y * viewLen;
    vec3 light = exp((sampleY - MAX_VIEW_DEPTH_DENSITY) * ABSORPTION);
    light *= uLight;

    float reflectivity = pow2(1.0 - max(0.0, dot(viewDir, normal)));
    float t = clamp(max(reflectivity, viewLen / MAX_VIEW_DEPTH), 0.0, 1.0);

    if (dot(viewDir, normal) < CRITICAL_ANGLE)
    {
        vec3 r = reflect(viewDir, -normal);
        sampleY = r.y * (MAX_VIEW_DEPTH - viewLen);
        vec3 rColor = exp((sampleY - MAX_VIEW_DEPTH_DENSITY) * ABSORPTION);
        rColor *= uLight;

        gl_FragColor = vec4(mix(rColor, light, t), 1.0);
        return;
    }

    gl_FragColor = vec4(light, t);
  }
`
