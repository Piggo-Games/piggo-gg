import { replaceCanvas, screenWH, ThreeCamera, World } from "@piggo-gg/core"
import { Scene, TextureLoader, WebGLRenderer } from "three"
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
  activate: (world: World) => void
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
    activate: (world: World) => {
      if (renderer.ready) return
      renderer.ready = true

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
    }
  }
  return renderer
}
