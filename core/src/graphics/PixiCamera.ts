import {
  ClientSystemBuilder, Entity, Renderable, Position,
  Character, abs, round, XY, XYZ, sign, sqrt, max, min
} from "@piggo-gg/core"
import { Application, Container } from "pixi.js"

export type PixiCamera = {
  angle: 0 | 1 | 2 | 3
  root: Container
  focus: Character | undefined
  scale: number
  add: (r: Renderable) => void
  remove: (r: Renderable) => void
  scaleBy: (delta: number) => void
  scaleTo: (scale: number) => void
  inFrame: (_: XY) => boolean
  moveBy: (_: XY) => void
  moveTo: (_: XY) => void
  toWorldCoords: (_: XY) => XY
  toCameraCoords: (_: XY) => XY
}

// PixiCamera handles the viewport of the game
export const PixiCamera = (app: Application): PixiCamera => {

  const root: Container = new Container({ sortableChildren: true, zIndex: 0, alpha: 1, cullableChildren: false })
  const renderables: Set<Renderable> = new Set()

  const camera: PixiCamera = {
    angle: 0,
    root,
    focus: undefined,
    scale: 2.5,
    add: (r: Renderable) => {
      renderables.add(r)
      root.addChild(r.c)
    },
    remove: (r: Renderable) => {
      renderables.delete(r)
      root.removeChild(r.c)
    },
    scaleBy: (delta: number) => {
      camera.scale += delta
      rescale()
    },
    scaleTo: (scale: number) => {
      camera.scale = scale
      rescale()
    },
    inFrame: ({ x, y }: XY) => { // TODO broken
      const { width, height } = app.screen

      const camX = ((width / 2) - root.x) / camera.scale
      const camY = ((height / 2) - root.y) / camera.scale

      const s = camera.scale * 1.4

      const result = abs(camX - x) < width / s && abs(camY - y) < height / s

      return result
    },
    moveBy: ({ x, y }: XY) => {
      root.x += x
      root.y += y
    },
    moveTo: ({ x, y }: XY) => {
      root.x = round(app.screen.width / 2 - x * camera.scale, 3)
      root.y = round(app.screen.height / 2 - y * camera.scale, 3)
    },
    toWorldCoords: ({ x, y }: XY) => (root.scale ? {
      x: round((x - root.x) / camera.scale, 3),
      y: round((y - root.y) / camera.scale, 3)
    } : { x: 0, y: 0 }),
    toCameraCoords: ({ x, y }: XY) => ({
      x: round(x * camera.scale + root.x, 3),
      y: round(y * camera.scale + root.y, 3)
    })
  }

  const rescale = () => {
    const min = 1.2
    const max = 5

    if (camera.scale < min) camera.scale = min
    if (camera.scale > max) camera.scale = max

    root.scale?.set(camera.scale, camera.scale)
  }

  rescale()

  return camera
}

type Follow = (_: XYZ) => XYZ

export const PixiCameraSystem = (follow: Follow = () => ({ x: 0, y: 0, z: 0 })) => ClientSystemBuilder({
  id: "PixiCameraSystem",
  init: (world) => {
    const { pixi } = world
    if (!pixi) return

    let targetScale = pixi.camera.scale

    // scroll to zoom
    pixi.canvas?.addEventListener("wheel", (event) => {
      targetScale += -0.01 * sign(event.deltaY) * sqrt(abs(event.deltaY))
      targetScale = min(targetScale, 5)
      targetScale = max(targetScale, 1)
    })

    return {
      id: "PixiCameraSystem",
      query: ["renderable", "position"],
      priority: 10,
      onTick: (entities: Entity<Renderable | Position>[]) => {
        // camera focus on player's character
        const character = world.client?.character()
        if (character) pixi.camera.focus = character

        // cull far away entities
        let numHidden = 0
        for (const entity of entities) {
          const { renderable } = entity.components

          if (renderable.cullable) {
            const { x, y } = renderable.c.position
            if (!pixi.camera.inFrame({ x, y })) {
              renderable.visible = false
              numHidden++
            } else {
              renderable.visible = true
            }
          }
        }
        // console.log(`hidden ${numHidden} entities`)
      },
      onRender: (_, delta) => {
        if (!pixi.camera.focus) return

        if (targetScale !== pixi.camera.scale) {
          const diff = targetScale - pixi.camera.scale
          pixi.camera.scaleBy(diff * 0.1)
        }

        const { position, renderable } = pixi.camera.focus.components
        if (!position || !renderable) return

        const interpolated = position.interpolate(world, delta)

        const { x, y, z } = follow(interpolated)

        const offset = {
          x: x + renderable.position.x,
          y: y + renderable.position.y
        }

        pixi?.camera.moveTo({ x: offset.x, y: offset.y - z })
      }
    }
  }
})
