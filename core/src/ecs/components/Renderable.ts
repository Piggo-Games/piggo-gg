import { Component, Entity, PixiRenderer, World, XY, keys, values, Position, PixiSkins, Client } from "@piggo-gg/core"
import { AdvancedBloomFilter, BevelFilter, GlowFilter, GodrayFilter, OutlineFilter } from "pixi-filters"
import { AnimatedSprite, BlurFilter, Container, Filter, Graphics, Sprite } from "pixi.js"

export type Dynamic = ((_: { container: Container, renderable: Renderable, entity: Entity<Renderable | Position>, world: World, client: Client }) => void)
export type DynamicDelta = ((_: { container: Container, renderable: Renderable, entity: Entity<Renderable | Position>, world: World, client: Client, delta: number }) => void)

export type Renderable = Component<"renderable", {
  desiredSkin: PixiSkins | undefined
}> & {
  activeAnimation: string
  anchor: XY
  animation: AnimatedSprite | undefined
  animations: Record<string, AnimatedSprite>
  animationSelect: null | ((entity: Entity<Position | Renderable>, world: World) => string)
  animationColor: number
  bufferedAnimation: string
  c: Container
  children: Renderable[] | undefined
  cullable: boolean
  currentSkin: PixiSkins | undefined
  color: number
  filters: Record<string, Filter>
  interactiveChildren: boolean
  interpolate: boolean
  initialized: boolean
  obedient: boolean
  position: XY
  r: Renderable | undefined
  rendered: boolean
  renderer: PixiRenderer
  rotates: boolean
  scale: number
  scaleMode: "nearest" | "linear"
  visible: boolean
  zIndex: number

  setContainer: ((r: PixiRenderer) => Promise<Container>) | undefined
  setChildren: ((r: PixiRenderer, w: World) => Promise<Renderable[]>) | undefined
  setup: ((renderable: Renderable, renderer: PixiRenderer, w: World) => Promise<void>) | undefined

  onRender: DynamicDelta | undefined
  onTick: Dynamic | undefined

  prepareAnimations: (color?: number, alpha?: number) => void
  setScale: (xy: XY) => void
  _init: (renderer: PixiRenderer | undefined, world: World) => Promise<void>
  setAnimation: (animationKey: string) => void
  setBevel: (_?: { rotation?: number, lightAlpha?: number, shadowAlpha?: number }) => void
  setBloom: (_?: { threshold?: number, bloomScale?: number }) => void
  setBlur: (_?: { strength?: number }) => void
  setGlow: (_?: { color?: number, quality?: number, innerStrength?: number, outerStrength?: number }) => void
  setOutline: (_?: { color: number, thickness: number }) => void
  setRays: (_?: { gain?: number, alpha?: number, lacunarity?: number }) => void
  cleanup: () => void
}

export type RenderableProps = {
  alpha?: number
  anchor?: XY
  animations?: Record<string, AnimatedSprite>
  animationSelect?: (entity: Entity<Position | Renderable>, world: World) => string
  animationColor?: number
  cacheAsBitmap?: boolean
  color?: number
  cullable?: boolean
  interactiveChildren?: boolean
  interpolate?: boolean
  obedient?: boolean
  position?: XY
  rotates?: boolean
  scale?: number
  scaleMode?: "nearest" | "linear"
  skin?: PixiSkins
  visible?: boolean
  zIndex?: number
  onRender?: DynamicDelta
  onTick?: Dynamic
  setChildren?: (r: PixiRenderer, w: World) => Promise<Renderable[]>
  setContainer?: (r: PixiRenderer) => Promise<Container>
  setup?: (renderable: Renderable, renderer: PixiRenderer, w: World) => Promise<void> // todo single arg
}

export const Renderable = (props: RenderableProps): Renderable => {

  const renderable: Renderable = {
    type: "renderable",
    data: {
      desiredSkin: props.skin ?? undefined
    },
    activeAnimation: "",
    anchor: props.anchor ?? { x: 0.5, y: 0.5 },
    animation: undefined,
    animations: props.animations ?? {},
    animationColor: props.animationColor ?? 0xffffff,
    animationSelect: props.animationSelect ?? null,
    bufferedAnimation: "",
    c: new Container(),
    r: undefined,
    color: props.color ?? 0xffffff,
    children: undefined,
    cullable: props.cullable ?? false,
    currentSkin: undefined,
    filters: {},
    initialized: false,
    interactiveChildren: props.interactiveChildren ?? false,
    interpolate: props.interpolate ?? false,
    onRender: props.onRender,
    onTick: props.onTick,
    obedient: props.obedient ?? true,
    position: props.position ?? { x: 0, y: 0 },
    rendered: false,
    renderer: undefined as unknown as PixiRenderer,
    rotates: props.rotates ?? false,
    scale: props.scale ?? 1,
    scaleMode: props.scaleMode ?? "linear",
    setChildren: props.setChildren ?? undefined,
    setContainer: props.setContainer ?? undefined,
    setup: props.setup ?? undefined,
    visible: props.visible ?? true,
    zIndex: props.zIndex ?? 0,
    prepareAnimations: (color: number = 0xffffff, alpha: number = 1) => {
      values(renderable.animations).forEach((animation: AnimatedSprite) => {
        animation.animationSpeed = 0.1
        animation.scale.set(renderable.scale)
        animation.anchor.set(renderable.anchor.x, renderable.anchor.y)
        animation.texture.source.scaleMode = renderable.scaleMode
        animation.tint = color
        animation.alpha = alpha
      })
      renderable.bufferedAnimation = keys(renderable.animations)[0]
    },
    setScale: (xy: XY) => {
      const { x, y } = xy
      if (keys(renderable.animations).length) {
        values(renderable.animations).forEach((animation: AnimatedSprite) => {
          if (x != animation.scale.x || y != animation.scale.y) {
            animation.scale.set(x * renderable.scale, y * renderable.scale)
          }
        })
      } else {
        renderable.c.scale.set(x * renderable.scale, y * renderable.scale)
      }
    },
    setAnimation: (animationKey: string) => {
      if (values(renderable.animations).length && renderable.animations[animationKey]) {
        renderable.bufferedAnimation = animationKey
      }
    },
    setBevel: (props: { rotation?: number, lightAlpha?: number, shadowAlpha?: number } = {}) => {
      const rotation = props.rotation ?? 135
      const lightAlpha = props.lightAlpha ?? 1
      const shadowAlpha = props.shadowAlpha ?? 0.4
      if (keys(renderable.animations).length) {
        values(renderable.animations).forEach((animation) => {
          animation.filters = [new BevelFilter({ rotation, lightAlpha, shadowAlpha })]
        })
      } else {
        renderable.filters["bevel"] = new BevelFilter({ rotation, lightAlpha, shadowAlpha })
        renderable.c.filters = values(renderable.filters)
      }
    },
    setBloom: (props: { threshold?: number, bloomScale?: number } = {}) => {
      const threshold = props.threshold ?? 0.5
      const bloomScale = props.bloomScale ?? 1
      if (keys(renderable.animations).length) {
        values(renderable.animations).forEach((animation) => {
          animation.filters = [new AdvancedBloomFilter({ threshold, bloomScale })]
        })
      } else {
        renderable.filters["bloom"] = new AdvancedBloomFilter({ threshold, bloomScale })
        renderable.c.filters = values(renderable.filters)
      }
    },
    setBlur: (props: { strength?: number } = {}) => {
      const strength = props.strength ?? 0
      if (keys(renderable.animations).length) {
        values(renderable.animations).forEach((animation) => {
          animation.filters = [new BlurFilter({ strength })]
        })
      } else {
        renderable.filters["blur"] = new BlurFilter({ strength })
        renderable.c.filters = values(renderable.filters)
      }
    },
    setGlow: (props: { color?: number, quality?: number, innerStrength?: number, outerStrength?: number } = {}) => {
      const color = props.color ?? 0xffffff
      const quality = props.quality ?? 1
      const innerStrength = props.innerStrength ?? 0
      const outerStrength = props.outerStrength ?? 0
      if (keys(renderable.animations).length) {
        values(renderable.animations).forEach((animation) => {
          animation.filters = [new GlowFilter({ color, quality, innerStrength, outerStrength })]
        })
      } else {
        renderable.filters["glow"] = new GlowFilter({ color, quality, innerStrength, outerStrength })
        renderable.c.filters = values(renderable.filters)
      }
    },
    setOutline: (props?: { color: number, thickness: number }) => {
      const { thickness, color } = props ?? { thickness: 0, color: 0x000000 }
      if (keys(renderable.animations).length) {
        values(renderable.animations).forEach((animation) => {
          animation.filters = [new OutlineFilter({ thickness, color, quality: 1 })]
        })
      } else {
        renderable.filters["outline"] = new OutlineFilter({ thickness, color, quality: 1 })
        renderable.c.filters = values(renderable.filters)
      }
    },
    setRays: (props: { gain?: number, alpha?: number, lacunarity?: number } = {}) => {
      const gain = props.gain ?? 0.5
      const alpha = props.alpha ?? 0.5
      const lacunarity = props.lacunarity ?? 2
      if (keys(renderable.animations).length) {
        values(renderable.animations).forEach((animation) => {
          animation.filters = [new GodrayFilter({ gain, alpha, lacunarity })]
        })
      } else {
        renderable.filters["rays"] = new GodrayFilter({ gain, alpha, lacunarity })
        renderable.c.filters = values(renderable.filters)
      }
    },
    cleanup: () => {
      // remove from the renderer
      renderable.renderer?.app.stage.removeChild(renderable.c)
      renderable.renderer?.camera.remove(renderable)
      if (renderable.children) {
        for (const child of renderable.children) {
          child.cleanup()
        }
      }

      // remove all event listeners
      renderable.c.removeAllListeners()

      renderable.c.renderable = false
      renderable.visible = false

      // remove from the world
      // renderable.c.destroy() // TODO disabled because it breaks debug mode
    },
    _init: async (renderer: PixiRenderer | undefined, world: World) => {
      if (!renderer) return
      renderable.renderer = renderer

      renderable.c = new Container()

      // add child container
      if (renderable.setContainer && renderer) renderable.c = await renderable.setContainer(renderer)

      // add children
      if (renderable.setChildren && renderer) {
        const childRenderables = await renderable.setChildren(renderer, world)
        renderable.children = childRenderables

        childRenderables.forEach(async (child) => {
          await child._init(renderer, world)
          if (child.obedient) {
            renderable.c.addChild(child.c)
          }
        })
      }

      if (renderable.setup) await renderable.setup(renderable, renderer, world)

      // set position
      renderable.c.position.set(renderable.position.x, renderable.position.y)

      // set interactive children
      renderable.c.interactiveChildren = renderable.interactiveChildren

      // set visible
      renderable.c.renderable = renderable.visible ?? true

      // set container properties
      renderable.c.zIndex = renderable.zIndex || 0
      renderable.c.sortableChildren = true
      renderable.c.alpha = 1

      if (keys(renderable.animations).length) {
        renderable.prepareAnimations(renderable.animationColor, props.alpha ?? 1)
      } else {
        const c = renderable.c as Sprite | Graphics
        if (c.texture) {
          c.scale = props.scale ?? 1

          // @ts-expect-error
          if (c.anchor) c.anchor.set(renderable.anchor.x, renderable.anchor.y)

          // @ts-expect-error
          if (c.texture.source) c.texture.source.scaleMode = props.scaleMode ?? "nearest"
        }
      }
      renderable.currentSkin = renderable.data.desiredSkin

      renderable.initialized = true
    }
  }

  return renderable
}
