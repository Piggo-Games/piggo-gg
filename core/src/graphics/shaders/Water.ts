import { Entity, max, min, Position, Three } from "@piggo-gg/core"
import { RepeatWrapping, Vector3, Mesh, BufferGeometry, BufferAttribute, ShaderMaterial } from "three"

export const Water = () => {

  let surface: Mesh | undefined = undefined

  const sky = Entity<Three>({
    id: "new-sky",
    components: {
      position: Position(),
      three: Three({
        onRender: ({ delta, client }) => {
          if (surface) {
            const mat = surface.material as ShaderMaterial

            mat.uniforms._Time.value += delta / 1000

            const pc = client.character()
            if (!pc) return

            let z = pc.components.position.data.z + 0.0

            // adjust the water height
            if (z > 0) {
              surface.position.y = -min(z, 5)
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
            uniforms: {
              _NormalMap1: { value: null },
              _NormalMap2: { value: null },
              _DirToLight: { value: new Vector3(1.0, 0.0, 1.0).normalize() },
              _Time: { value: 0 },
              _Light: { value: new Vector3(0.5, 0.5, 0.5) }
            }
          })

          three.tLoader.loadAsync("waterNormal1.png").then((t) => {
            t.wrapS = RepeatWrapping
            t.wrapT = RepeatWrapping
            surfaceMat.uniforms._NormalMap1.value = t
          })

          three.tLoader.loadAsync("waterNormal2.png").then((t) => {
            t.wrapS = RepeatWrapping
            t.wrapT = RepeatWrapping
            surfaceMat.uniforms._NormalMap2.value = t
          })

          surface.material = surfaceMat;

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

    const float NORMAL_MAP_SCALE = 0.01;
    const float NORMAL_MAP_STRENGTH = 0.2;
    const vec2 VELOCITY_1 = vec2(0.1, 0.0);
    const vec2 VELOCITY_2 = vec2(0.0, 0.1);
    const float SPECULAR_SHARPNESS = 5.0;
    const float MAX_VIEW_DEPTH = 100.0;
    const float DENSITY = 0.35;
    const float MAX_VIEW_DEPTH_DENSITY = MAX_VIEW_DEPTH * DENSITY;
    const vec3 ABSORPTION = vec3(1.0) / vec3(10.0, 40.0, 100.0);
    const float CRITICAL_ANGLE = asin(1.0 / 1.33) / 1.5708;
    const float FOG_DISTANCE = 1000.0;

    //  float dither = 0.0;
    float dither = 0.0;

    uniform float _Time;
    uniform sampler2D _NormalMap1;
    uniform sampler2D _NormalMap2;
    uniform vec3 _Light;

    uniform vec3 _DirToLight;

    float pow2(float v) {
      return v * v;
    }

    void main()
    {
        vec3 viewVec = vec3(_worldPos.x, 0.0, _worldPos.y) - cameraPosition;
        float viewLen = length(viewVec) * 0.992;
        vec3 viewDir = viewVec / viewLen + vec3(0.0, -0.08, 0.0);

        vec3 normal = texture2D(_NormalMap1, _uv + VELOCITY_1 * _Time).xyz * 2.0 - 1.0;
        normal += texture2D(_NormalMap2, _uv + VELOCITY_2 * _Time).xyz * 2.0 - 1.0;
        normal *= NORMAL_MAP_STRENGTH;
        normal += vec3(0.0, 0.0, 1.0);
        normal = normalize(normal).xzy;

        if (cameraPosition.y > 0.0) {
          vec3 halfWayDir = normalize(_DirToLight - viewDir) + vec3(0.0, 0.24, 0.0);
          float specular = max(0.0, dot(normal, halfWayDir));
          specular = pow(specular, SPECULAR_SHARPNESS);

          float reflectivity = pow2(1.0 - max(0.0, dot(-viewDir, normal)));

          // vec3 reflection = sampleSkybox(reflect(viewDir, normal));
          vec3 blue = vec3(0.46, 0.46, 1.0);
          vec3 surface = reflectivity * blue;

          surface += vec3(0.8, 0.4, 0.1) * specular * specular;
          surface -= vec3(0.0, 0.0, 0.1) * specular * specular;
          // surface = min(surface, 0.8);

          gl_FragColor = vec4(surface, max(reflectivity, specular));
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
`
