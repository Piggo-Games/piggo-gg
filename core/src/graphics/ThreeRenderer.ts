import { ClientSystemBuilder, dummyPromise, logPerf, replaceCanvas, screenWH, ThreeCamera, values, World } from "@piggo-gg/core"
import { Mesh, MeshPhongMaterial, Scene, SphereGeometry, TextureLoader, WebGLRenderer } from "three"
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
  append: (...elements: HTMLElement[]) => void
  activate: (world: World) => Promise<void>
  deactivate: () => void
  resize: () => void
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
    deactivate: () => {
      renderer.scene.clear()

      webgl?.setAnimationLoop(null)
      webgl?.dispose()

      renderer.ready = false
    },
    activate: async (world: World) => {
      if (renderer.ready) return
      renderer.ready = true

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

      renderer.resize()

      logPerf("ThreeRenderer.activate", t1)
    }
  }
  return renderer
}

export const ThreeDebugSystem = ClientSystemBuilder({
  id: "ThreeDebugSystem",
  init: (world) => {

    let meshes: Record<string, Mesh> = {}

    return {
      id: "ThreeDebugSystem",
      priority: 5,
      skipOnRollback: true,
      query: ["debug", "three", "position"],
      onRender: (_, delta) => {
        if (!world.debug) return

        // character mesh
        // const pc = world.client?.character()
        // if (pc) {
        //   if (!meshes["debug_sphere1"]) {
        //     const sphere1 = new Mesh(
        //       new SphereGeometry(0.1), new MeshPhongMaterial({ color: 0xff0000, wireframe: true })
        //     )
        //     meshes["debug_sphere1"] = sphere1
        //     world.three?.scene.add(sphere1)
        //   }

        //   if (!meshes["debug_sphere2"]) {
        //     const sphere2 = new Mesh(
        //       new SphereGeometry(0.1), new MeshPhongMaterial({ color: 0x00ff00, wireframe: true })
        //     )
        //     meshes["debug_sphere2"] = sphere2
        //     world.three?.scene.add(sphere2)
        //   }

        //   const mesh1 = meshes["debug_sphere1"]
        //   const mesh2 = meshes["debug_sphere2"]
        //   const { x, y, z } = pc.components.position.interpolate(world, delta)

          // mesh1.position.set(x, z, y)
          // mesh2.position.set(x, z + 0.41, y)
        // }
      },
      onTick: () => {
        if (!world.debug) {
          for (const mesh of values(meshes)) {
            world.three?.scene.remove(mesh)
          }
          meshes = {}
        }
      }
    }
  }
})
