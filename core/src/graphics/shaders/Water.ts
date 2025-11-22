import { Entity, loadTexture, Position, Three } from "@piggo-gg/core"
import { PlaneGeometry, TextureLoader, RepeatWrapping, Vector3, Mesh, BufferGeometry, BufferAttribute, ShaderMaterial } from "three"
import { Water as ThreeWater } from "three/examples/jsm/objects/Water.js"

export const Water = () => {

  // let water: ThreeWater | undefined = undefined
  let surface: Mesh | undefined = undefined
  let volume: Mesh | undefined = undefined

  let init = false

  const sky = Entity<Three>({
    id: "new-sky",
    components: {
      position: Position(),
      three: Three({
        onRender: ({ delta }) => {
          if (surface) {
            const mat = surface.material as ShaderMaterial
            mat.uniforms._Time.value += delta
          }
        },
        init: async (o) => {
          if (init) return

          surface = new Mesh()
          volume = new Mesh()

          const halfSize = 1500
          const depth = 1000
          const surfaceY = -0.3

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

          // const normalMap1 = await loadTexture("waterNormal1.png")
          // console.log("loaded normal 1", normalMap1)




          const surfaceMat = new ShaderMaterial({
            vertexShader: surfaceVertex,
            fragmentShader: surfaceFragment,
            side: 2,
            uniforms: {
              _NormalMap1: { value: new TextureLoader().load("waterNormal1.png") },
              _NormalMap2: { value: new TextureLoader().load("waterNormal2.png") },
              _DirToLight: { value: new Vector3(0.5, 1, 0.75).normalize() },
              _Time: { value: 0 },
              _Light: { value: new Vector3(1, 1, 1) }
            }
          })

          surface.material = surfaceMat;

          // const volumeVertices = new Float32Array([
          //   -halfSize, -depth, -halfSize,
          //   halfSize, -depth, -halfSize,
          //   -halfSize, -depth, halfSize,
          //   halfSize, -depth, halfSize,

          //   -halfSize, 0, -halfSize,
          //   halfSize, 0, -halfSize,
          //   -halfSize, 0, halfSize,
          //   halfSize, 0, halfSize
          // ])

          // const volumeIndices = [
          //   2, 3, 0, 3, 1, 0,
          //   0, 1, 4, 1, 5, 4,
          //   1, 3, 5, 3, 7, 5,
          //   3, 2, 7, 2, 6, 7,
          //   2, 0, 6, 0, 4, 6
          // ]

          // const volumeGeometry = new BufferGeometry()
          // volumeGeometry.setAttribute("position", new BufferAttribute(volumeVertices, 3))
          // volumeGeometry.setIndex(volumeIndices)

          // volume.geometry = volumeGeometry

          // const volumeMat = new ShaderMaterial({
          //   vertexShader: volumeVertex,
          //   fragmentShader: volumeFragment,
          //   uniforms: {}
          // })

          // volume.material = volumeMat

          // volume.parent = surface
          surface.add(volume)

          o.push(surface)
        }
      })
    }
  })

  return sky
}


export const surfaceVertex =
/*glsl*/`
    // #include <ocean>

    varying vec2 _worldPos;
    varying vec2 _uv;

    void main()
    {
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        _worldPos = worldPos.xz;
        _uv = _worldPos * 0.1; // NORMAL_MAP_SCALE
        gl_Position = projectionMatrix * viewMatrix * worldPos;
    }
`;

export const surfaceFragment =
/*glsl*/`
    // #include <ocean>

    varying vec2 _worldPos;
    varying vec2 _uv;

    const float NORMAL_MAP_SCALE = 0.1;
    const float NORMAL_MAP_STRENGTH = 0.2;
    const vec2 VELOCITY_1 = vec2(0.1, 0.0);
    const vec2 VELOCITY_2 = vec2(0.0, 0.1);
    const float SPECULAR_SHARPNESS = 100.0;
    const float SPECULAR_SIZE = 1.1;
    const float MAX_VIEW_DEPTH = 100.0;
    const float DENSITY = 0.35;
    const float MAX_VIEW_DEPTH_DENSITY = MAX_VIEW_DEPTH * DENSITY;
    const vec3 ABSORPTION = vec3(1.0) / vec3(10.0, 40.0, 100.0);
    const float CRITICAL_ANGLE = asin(1.0 / 1.33) / 1.5708;
    const float FOG_DISTANCE = 1000.0;
    const float dither = 0.0;

    uniform float _Time;
    uniform sampler2D _NormalMap1;
    uniform sampler2D _NormalMap2;
    uniform vec3 _Light;

    uniform vec3 _DirToLight;

    // void sampleDither(vec2 fragCoord)
    // {
    //     dither = (texture2D(_DitherTexture, (fragCoord - vec2(0.5)) / _DitherTextureSize).x - 0.5) * DITHER_STRENGTH;
    // }

    float pow2(float v) {
      return v * v;
    }

    void main()
    {
        vec3 viewVec = vec3(_worldPos.x, 0.0, _worldPos.y) - cameraPosition;
        float viewLen = length(viewVec);
        vec3 viewDir = viewVec / viewLen;

        vec3 normal = texture2D(_NormalMap1, _uv + VELOCITY_1 * _Time).xyz * 2.0 - 1.0;
        normal += texture2D(_NormalMap2, _uv + VELOCITY_2 * _Time).xyz * 2.0 - 1.0;
        normal *= NORMAL_MAP_STRENGTH;
        normal += vec3(0.0, 0.0, 1.0);
        normal = normalize(normal).xzy;

        // sampleDither(gl_FragCoord.xy);

        if (cameraPosition.y > 0.0)
        {
            vec3 halfWayDir = normalize(_DirToLight - viewDir);
            float specular = max(0.0, dot(normal, halfWayDir));
            // specular = pow(specular, SPECULAR_SHARPNESS) * _SpecularVisibility;

            float reflectivity = pow2(1.0 - max(0.0, dot(-viewDir, normal)));

            // vec3 reflection = sampleSkybox(reflect(viewDir, normal));
            vec3 reflection = vec3(0.0, 0.3, 0.5); // approximate sky color
            vec3 surface = reflectivity * reflection;
            surface = max(surface, specular);

            float fog = clamp(viewLen / FOG_DISTANCE + dither, 0.0, 1.0);
            // surface = mix(surface, sampleFog(viewDir), fog);

            gl_FragColor = vec4(surface, max(max(reflectivity, specular), fog));
            return;
        }

        float originY = cameraPosition.y;
        viewLen = min(viewLen, MAX_VIEW_DEPTH);
        float sampleY = originY + viewDir.y * viewLen;
        vec3 light = exp((sampleY - MAX_VIEW_DEPTH_DENSITY) * ABSORPTION);
        light *= _Light;

        float reflectivity = pow2(1.0 - max(0.0, dot(viewDir, normal)));
        float t = clamp(max(reflectivity, viewLen / MAX_VIEW_DEPTH) + dither, 0.0, 1.0);

        if (dot(viewDir, normal) < CRITICAL_ANGLE)
        {
            vec3 r = reflect(viewDir, -normal);
            sampleY = r.y * (MAX_VIEW_DEPTH - viewLen);
            vec3 rColor = exp((sampleY - MAX_VIEW_DEPTH_DENSITY) * ABSORPTION);
            rColor *= _Light;

            gl_FragColor = vec4(mix(rColor, light, t), 1.0);
            return;
        }

        gl_FragColor = vec4(light, t);
    }
`;

export const volumeVertex =
/*glsl*/`
    varying vec3 _worldPos;

    void main()
    {
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        _worldPos = worldPos.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPos;
    }
`;

export const volumeFragment =
/*glsl*/`
    // #include <ocean>

    varying vec3 _worldPos;

    void main()
    {
        vec3 viewVec = _worldPos - cameraPosition;
        float viewLen = length(viewVec);
        vec3 viewDir = viewVec / viewLen;
        float originY = cameraPosition.y;

        if (cameraPosition.y > 0.0)
        {
            float distAbove = cameraPosition.y / -viewDir.y;
            viewLen -= distAbove;
            originY = 0.0;
        }
        viewLen = min(viewLen, MAX_VIEW_DEPTH);

        float sampleY = originY + viewDir.y * viewLen;
        vec3 light = exp((sampleY - viewLen * DENSITY) * ABSORPTION);
        light *= _Light;
        
        gl_FragColor = vec4(light, 1.0);
    }
`;

export const objectVertex =
/*glsl*/`
    varying vec3 _worldPos;
    varying vec3 _normal;
    varying vec2 _uv;
    
    void main()
    {
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        _worldPos = worldPos.xyz;
        _normal = normal;
        _uv = uv;
        gl_Position = projectionMatrix * viewMatrix * worldPos;
    }
`;

export const objectFragment =
/*glsl*/`
    // #include <ocean>

    uniform vec3 _CameraForward;
    uniform sampler2D _MainTexture;
    uniform float _SpotLightSharpness;
    uniform float _SpotLightDistance;

    varying vec3 _worldPos;
    varying vec3 _normal;
    varying vec2 _uv;

    void main()
    {
        float dirLighting = max(0.333, dot(_normal, _DirToLight));
        vec3 texture = texture2D(_MainTexture, _uv).xyz * dirLighting;
        
        vec3 viewVec = _worldPos - cameraPosition;
        float viewLen = length(viewVec);
        vec3 viewDir = viewVec / viewLen;

        if (_worldPos.y > 0.0)
        {
            if (cameraPosition.y < 0.0)
            {
                viewLen -= cameraPosition.y / -viewDir.y;
            }

            sampleDither(gl_FragCoord.xy);
            vec3 fogColor = sampleFog(viewDir);
            float fog = clamp(viewLen / FOG_DISTANCE + dither, 0.0, 1.0);
            gl_FragColor = vec4(mix(texture, fogColor, fog), 1.0);
            return;
        }

        float originY = cameraPosition.y;

        if (cameraPosition.y > 0.0)
        {
            viewLen -= cameraPosition.y / -viewDir.y;
            originY = 0.0;
        }
        viewLen = min(viewLen, MAX_VIEW_DEPTH);

        float sampleY = originY + viewDir.y * viewLen;
        vec3 light = exp((sampleY - viewLen * DENSITY) * ABSORPTION) * _Light;

        float spotLight = 0.0;
        float spotLightDistance = 1.0;
        if (_SpotLightDistance > 0.0)
        {
            spotLightDistance =  min(distance(_worldPos, cameraPosition) / _SpotLightDistance, 1.0);
            spotLight = pow(max(dot(viewDir, _CameraForward), 0.0), _SpotLightSharpness) * (1.0 - spotLightDistance);
        }
        
        light = min(light + spotLight, vec3(1.0));

        gl_FragColor = vec4(mix(texture * light, light, min(viewLen / MAX_VIEW_DEPTH, 1.0 - spotLight)), 1.0);
    }
`;

export const triplanarVertex =
/*glsl*/`
    varying vec3 _worldPos;
    varying vec3 _normal;
    
    void main()
    {
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        _worldPos = worldPos.xyz;
        _normal = normal;
        gl_Position = projectionMatrix * viewMatrix * worldPos;
    }
`;

export const triplanarFragment =
/*glsl*/`
    // #include <ocean>

    uniform vec3 _CameraForward;
    uniform sampler2D _MainTexture;
    uniform float _BlendSharpness;
    uniform float _Scale;
    uniform float _SpotLightSharpness;
    uniform float _SpotLightDistance;

    varying vec3 _worldPos;
    varying vec3 _normal;

    void main()
    {
        float dirLighting = max(0.4, dot(_normal, _DirToLight));

        vec3 weights = abs(_normal);
        weights = vec3(pow(weights.x, _BlendSharpness), pow(weights.y, _BlendSharpness), pow(weights.z, _BlendSharpness));
        weights = weights / (weights.x + weights.y + weights.z);

        vec3 textureX = texture2D(_MainTexture, _worldPos.yz * _Scale).xyz * weights.x;
        vec3 textureY = texture2D(_MainTexture, _worldPos.xz * _Scale).xyz * weights.y;
        vec3 textureZ = texture2D(_MainTexture, _worldPos.xy * _Scale).xyz * weights.z;

        vec3 texture = (textureX + textureY + textureZ) * dirLighting;
        
        vec3 viewVec = _worldPos - cameraPosition;
        float viewLen = length(viewVec);
        vec3 viewDir = viewVec / viewLen;

        if (_worldPos.y > 0.0)
        {
            if (cameraPosition.y < 0.0)
            {
                viewLen -= cameraPosition.y / -viewDir.y;
            }

            sampleDither(gl_FragCoord.xy);
            vec3 fogColor = sampleFog(viewDir);
            float fog = clamp(viewLen / FOG_DISTANCE + dither, 0.0, 1.0);
            gl_FragColor = vec4(mix(texture, fogColor, fog), 1.0);
            return;
        }

        float originY = cameraPosition.y;

        if (cameraPosition.y > 0.0)
        {
            viewLen -= cameraPosition.y / -viewDir.y;
            originY = 0.0;
        }
        viewLen = min(viewLen, MAX_VIEW_DEPTH);

        float sampleY = originY + viewDir.y * viewLen;
        vec3 light = exp((sampleY - viewLen * DENSITY) * ABSORPTION) * _Light;

        float spotLight = 0.0;
        float spotLightDistance = 1.0;
        if (_SpotLightDistance > 0.0)
        {
            spotLightDistance =  min(distance(_worldPos, cameraPosition) / _SpotLightDistance, 1.0);
            spotLight = pow(max(dot(viewDir, _CameraForward), 0.0), _SpotLightSharpness) * (1.0 - spotLightDistance);
        }
        
        light = min(light + spotLight, vec3(1.0));

        gl_FragColor = vec4(mix(texture * light, light, min(viewLen / MAX_VIEW_DEPTH, 1.0 - spotLight)), 1.0);
    }
`;
