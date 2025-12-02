import {
  ClientSystemBuilder, dummyPromise, Particle, randomColorBG,
  randomColorRY, randomVector3, replaceCanvas, screenWH,
  ThreeCamera, values, World, XYZ
} from "@piggo-gg/core"
import { Color, Mesh, MeshPhongMaterial, Scene, SphereGeometry, TextureLoader, WebGLRenderer } from "three"
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"

export type ThreeRenderer = {
  camera: ThreeCamera
  canvas: HTMLCanvasElement | undefined
  fLoader: FBXLoader
  gLoader: GLTFLoader
  ready: boolean
  scene: Scene
  tLoader: TextureLoader
  particles: Particle[]
  append: (...elements: HTMLElement[]) => void
  activate: (world: World) => Promise<void>
  spawnParticles: (pos: XYZ, world: World, type?: ParticleType) => void
  deactivate: () => void
  resize: () => void
}

export type ParticleType = "water" | "blast" | "blood"

const ParticleMap: Record<ParticleType, { colorFunction: () => Color, duration: number, gravity: number }> = {
  water: { colorFunction: randomColorBG, duration: 9, gravity: 0.0024 },
  blast: { colorFunction: randomColorRY, duration: 6, gravity: 0 },
  blood: { colorFunction: () => new Color(0xff0000), duration: 12, gravity: 0.003 }
}

export const ThreeRenderer = (): ThreeRenderer => {

  let webgl: undefined | WebGLRenderer

  const renderer: ThreeRenderer = {
    canvas: undefined,
    camera: ThreeCamera(),
    scene: new Scene(),
    ready: false,
    fLoader: new FBXLoader(),
    gLoader: new GLTFLoader(),
    tLoader: new TextureLoader(),
    particles: [],
    append: (...elements: HTMLElement[]) => {
      const parent = document.getElementById("canvas-parent")
      if (parent) parent.append(...elements)
    },
    resize: () => {
      if (!webgl || !renderer.ready) return

      const { w, h } = screenWH()
      webgl.setSize(w, h)
      renderer.camera.c.aspect = w / h

      renderer.camera.c.updateProjectionMatrix()
    },
    spawnParticles: (pos: XYZ, world: World, type: ParticleType = "blast") => {
      const proto = renderer.particles[0]
      if (!proto) return

      // explosion particles
      for (let i = 0; i < 20; i++) {
        const mesh = proto.mesh.clone()
        mesh.position.set(pos.x, pos.z, pos.y)

        // vary the color
        console.log("spawning particle", type, ParticleMap[type])
        const color = ParticleMap[type].colorFunction()
        mesh.material = new MeshPhongMaterial({ color, emissive: color })

        renderer.particles.push({
          mesh,
          tick: world.tick,
          velocity: randomVector3(0.03),
          pos: { ...pos },
          duration: ParticleMap[type].duration,
          gravity: ParticleMap[type].gravity
        })

        world.three?.scene.add(mesh)
      }
    },
    deactivate: () => {
      renderer.scene.clear()

      webgl?.setAnimationLoop(null)
      webgl?.dispose()

      renderer.ready = false
    },
    activate: async (world: World) => {
      if (renderer.ready) return
      const t1 = performance.now()

      await dummyPromise()

      renderer.canvas = replaceCanvas()

      webgl = new WebGLRenderer({
        antialias: true,
        canvas: renderer.canvas,
        powerPreference: "high-performance",
        precision: "highp"
      })

      webgl.setPixelRatio(window.devicePixelRatio)
      webgl.shadowMap.enabled = true
      webgl.shadowMap.type = 2

      // prevent right-click
      renderer.canvas.addEventListener("contextmenu", (event) => event.preventDefault())

      // handle screen resize
      window.addEventListener("resize", renderer.resize)

      // handle orientation change
      screen.orientation.addEventListener("change", renderer.resize)

      webgl.setAnimationLoop(() => {
        world.onRender()

        webgl?.render(renderer.scene, renderer.camera.c)
      })

      renderer.ready = true

      renderer.resize()

      // logPerf("ThreeRenderer.activate", t1)
    }
  }
  return renderer
}

export const ParticleSystem = ClientSystemBuilder({
  id: "ParticleSystem",
  init: (world) => {

    const particleMesh = new Mesh(new SphereGeometry(0.008, 6, 6))
    particleMesh.castShadow = true

    world.three!.particles.push({ mesh: particleMesh, velocity: { x: 0, y: 0, z: 0 }, tick: 0, pos: { x: 0, y: 0, z: 0 }, duration: 0, gravity: 0 })

    return {
      id: "ParticleSystem",
      priority: 5,
      skipOnRollback: true,
      query: ["debug", "three", "position"],
      onRender: (_, delta) => {
        if (!world.three) return

        const ratio = delta / 25
        const { particles } = world.three

        // particles
        for (let i = 1; i < particles.length; i++) {
          const p = particles[i]

          if (world.tick - p.tick >= p.duration) {
            if (p.mesh.parent) {
              world.three?.scene.remove(p.mesh)
            }
            particles.splice(i, 1)
            i--
          } else {
            p.mesh.position.set(
              p.pos.x + p.velocity.x * ratio,
              p.pos.z + p.velocity.z * ratio,
              p.pos.y + p.velocity.y * ratio
            )
          }
        }
      },
      onTick: () => {
        if (!world.three) return

        const { particles } = world.three

        for (let i = 1; i < particles.length; i++) {
          const p = particles[i]

          p.pos = {
            x: p.pos.x + p.velocity.x,
            y: p.pos.y + p.velocity.y,
            z: p.pos.z + p.velocity.z
          }

          p.velocity.z -= p.gravity
        }
      }
    }
  }
})
