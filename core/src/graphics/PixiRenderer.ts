import {
  ClientSystemBuilder, Entity, PixiCamera, Position,
  Renderable, World, logPerf, replaceCanvas, screenWH
} from "@piggo-gg/core"
import { Application } from "pixi.js"

export type PixiRenderer = {
  app: Application
  canvas: HTMLCanvasElement | undefined
  camera: PixiCamera
  guiRenderables: Renderable[]
  ready: boolean
  resizedFlag: boolean
  activate: (world: World) => Promise<void>
  addGui: (renderable: Renderable) => void
  addWorld: (renderable: Renderable) => void
  deactivate: () => void
  handleResize: () => void
  setBgColor: (color: number) => void
  wh: () => { width: number, height: number }
}

export const PixiRenderer = (): PixiRenderer => {

  let app = new Application()

  const renderer: PixiRenderer = {
    app,
    canvas: undefined,
    camera: PixiCamera(app),
    guiRenderables: [],
    ready: false,
    resizedFlag: false,
    addGui: (renderable: Renderable) => {
      if (renderable) {
        renderer.app.stage.addChild(renderable.c)
        renderer.guiRenderables.push(renderable)
      }
    },
    addWorld: (renderable: Renderable) => {
      if (renderable) renderer.camera?.add(renderable)
    },
    deactivate: () => {
      if (!renderer.ready) return
      renderer.ready = false

      try {
        app.destroy({ removeView: false }, { children: true, texture: true, context: true, style: true, textureSource: true })
      } catch (e) {
        console.error("error destroying pixi app", e)
      }
    },
    handleResize: () => {
      if (!renderer.ready) return

      const { w, h } = screenWH()
      renderer.app.renderer.resize(w, h)

      renderer.resizedFlag = true
    },
    activate: async (world: World) => {
      if (renderer.ready) return
      renderer.ready = true

      renderer.canvas = replaceCanvas()

      app = new Application()
      renderer.app = app

      renderer.camera = PixiCamera(app)

      // init pixi.js application
      await app.init({
        canvas: renderer.canvas,
        resolution: 1,
        antialias: true,
        autoDensity: true,
        backgroundColor: 0x000000,
        preference: "webgl",
        preferWebGLVersion: 2
      })

      // resize once
      renderer.handleResize()

      // set up the camera
      app.stage.addChild(renderer.camera.root)

      // hide the cursor
      // app.renderer.events.cursorStyles.default = "none"

      // handle screen resize
      window.addEventListener("resize", renderer.handleResize)

      // handle fullscreen change
      document.addEventListener("fullscreenchange", renderer.handleResize)

      // handle orientation change
      screen?.orientation?.addEventListener("change", () => renderer.handleResize)

      // prevent right-click
      renderer.canvas?.addEventListener("contextmenu", (event) => event.preventDefault())

      // schedule onRender
      app.ticker.add(world.onRender)
    },
    setBgColor: (color: number) => {
      if (app.renderer) app.renderer.background.color = color
    },
    wh: () => renderer.ready ? { width: app.screen.width, height: app.screen.height } : { width: 0, height: 0 }
  }
  return renderer
}

export const PixiRenderSystem = ClientSystemBuilder({
  id: "PixiRenderSystem",
  init: (world) => {
    const renderNewEntity = async (entity: Entity<Renderable | Position>) => {
      const { renderable, position } = entity.components

      await renderable._init(world.pixi, world)

      if (position.screenFixed) {
        world.pixi?.addGui(renderable)
      } else {
        world.pixi?.addWorld(renderable)
      }
    }

    // updates the position of screenFixed entities
    const updateScreenFixed = (entity: Entity<Renderable | Position>) => {
      const { position, renderable } = entity.components
      if (!position.screenFixed || !world.pixi?.ready) return

      const { w, h } = screenWH()

      if (position.data.x < 0) {
        renderable.c.x = w + position.data.x
      } else {
        renderable.c.x = position.data.x
      }

      if (position.data.y < 0) {
        renderable.c.y = h + position.data.y
      } else {
        renderable.c.y = position.data.y
      }
    }

    return {
      id: "PixiRenderSystem",
      query: ["renderable", "position"],
      priority: 11,
      onTick: (entities: Entity<Renderable | Position>[]) => {
        const { pixi, client } = world
        if (!pixi || !client) return

        if (!pixi.ready) return

        if (pixi.resizedFlag) {
          pixi.guiRenderables.forEach((renderable) => {
            pixi.app.stage.removeChild(renderable.c)
            renderable.rendered = false
          })

          pixi.resizedFlag = false
        }

        const time = performance.now()
        for (const entity of entities) {
          const { position, renderable } = entity.components

          // render if skin changed
          if (renderable.currentSkin && renderable.currentSkin !== renderable.data.desiredSkin) {
            renderable.c.removeChildren()
            renderable.rendered = false
          }

          // render if new entity
          if (!renderable.rendered) {
            renderNewEntity(entity)
            renderable.rendered = true
          }

          // run dynamic callback
          if (renderable.onTick && renderable.initialized) renderable.onTick({
            container: renderable.c, entity, world, renderable, client
          })

          // run dynamic callback for children
          if (renderable.children && renderable.initialized) {
            for (const child of renderable.children) {
              if (!child.rendered) {
                if (!child.obedient) {
                  position.screenFixed ? pixi?.addGui(child) : pixi?.addWorld(child)
                }
                child.rendered = true
              } else {
                child.onTick?.({ container: child.c, entity, world, renderable: child, client })
              }
            }
          }

          // update rotation
          if (renderable.rotates) {
            renderable.c.rotation = position.data.rotation
          }

          // update position
          const { x, y } = {
            x: renderable.position.x + position.data.x,
            y: renderable.position.y + position.data.y
          }
          renderable.c.position.set(x, y - position.data.z)

          // update tint
          renderable.c.tint = renderable.color

          // set buffered ortho animation
          if (!renderable.bufferedAnimation) {
            renderable.bufferedAnimation = renderable.animationSelect ? renderable.animationSelect(entity, world) : position.orientation
          }

          // handle buffered animations
          if (
            renderable.bufferedAnimation !== renderable.activeAnimation &&
            renderable.animations[renderable.bufferedAnimation]
          ) {
            // remove current animation
            if (renderable.animation) renderable.c.removeChild(renderable.animation)

            // set new animation
            renderable.animation = renderable.animations[renderable.bufferedAnimation]

            // add animation to container
            renderable.c.addChild(renderable.animation)

            // play the animation
            renderable.animation.gotoAndPlay(0)

            // set activeAnimation
            renderable.activeAnimation = renderable.bufferedAnimation
            renderable.bufferedAnimation = ""
          }

          // reset buffered animation
          if (renderable.bufferedAnimation === renderable.activeAnimation) {
            renderable.bufferedAnimation = ""
          }

          // set visible
          if (renderable.c.renderable !== renderable.visible) renderable.c.renderable = renderable.visible
        }
        logPerf("render loop", time)

        // sort entities by position (closeness to camera)
        entities = entities.filter(x => x.components.renderable.visible)
        entities.sort((a, b) => a.components.position.data.y - b.components.position.data.y)

        // set zIndex
        for (const [index, entity] of entities.entries()) {
          const { renderable } = entity.components
          renderable.c.zIndex = renderable.zIndex + 0.0001 * index
        }

        // update screenFixed entities
        for (const entity of world.queryEntities<Renderable | Position>(["renderable", "position"])) {
          updateScreenFixed(entity)
        }
      },
      onRender(entities: Entity<Renderable | Position>[], delta) {
        const { pixi, client } = world
        if (!pixi || !client) return

        for (const entity of entities) {
          const { position, renderable } = entity.components

          if (renderable.onRender && renderable.initialized) {
            renderable.onRender({ container: renderable.c, client, delta, entity, renderable, world })
          }

          // children onRender
          if (renderable.children && renderable.initialized) {
            for (const child of renderable.children) {
              child.onRender?.({ container: child.c, entity, world, renderable: child, client, delta })
            }
          }

          if (!renderable.rendered || !renderable.interpolate) continue

          // UI renderables
          if (position.screenFixed) {
            updateScreenFixed(entity)
          }

          // world renderables
          const { velocity } = position.data
          if ((velocity.x || velocity.y || velocity.z)) {

            const interpolated = position.interpolate(world, delta)

            const offset = {
              x: renderable.position.x + interpolated.x,
              y: renderable.position.y + interpolated.y,
            }

            renderable.c.position.set(offset.x, offset.y - interpolated.z)
          }
        }
      }
    }
  }
})
