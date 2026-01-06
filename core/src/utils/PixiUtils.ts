import {
  AnimatedSprite, AnimatedSpriteFrames, Assets, Container, Graphics,
  GraphicsContext, GraphicsOptions, Text, TextStyleFontWeight, Texture
} from "pixi.js"
import { cos, sin, XY } from "@piggo-gg/core"

export type pixiRectProps = { x: number, y: number, w: number, h: number, rounded?: number, style?: Omit<pixiStyleProps, "g"> }
export type pixiCircleProps = { x?: number, y?: number, r: number, style?: Omit<pixiStyleProps, "g"> }
export type pixiStyleProps = { g: Graphics, color?: number, alpha?: number, strokeColor?: number, strokeAlpha?: number, strokeWidth?: number }

export type pixiTextStyle = {
  align?: "left" | "center" | "right"
  alpha?: number
  dropShadow?: boolean
  scale?: number
  fill?: number
  fontFamily?: string
  fontSize?: number
  fontWeight?: TextStyleFontWeight
  resolution?: number
}

export type pixiTextProps = { text: string, anchor?: XY, pos?: XY, style?: pixiTextStyle }

export const pixiContainer = (): Container => new Container()

export const pixiAnimation = (frames: AnimatedSpriteFrames) => new AnimatedSprite(frames)

export const pixiGraphics = (opts: GraphicsOptions | GraphicsContext = {}): Graphics => new Graphics(opts)

export const pixiRect = ({ x, y, w, h, rounded = 0, style }: pixiRectProps): Graphics => {
  const g = new Graphics()
  g.roundRect(x, y, w, h, rounded)

  return pixiStyle({ g, ...style })
}

export const pixiCircle = ({ x = 0, y = 0, r, style = {} }: pixiCircleProps): Graphics => {
  const g = pixiGraphics().circle(x, y, r)
  return pixiStyle({ g, strokeWidth: 0, ...style })
}

export const pixiStyle = ({ g, color, alpha, strokeColor, strokeAlpha, strokeWidth }: pixiStyleProps): Graphics => {
  return g.fill({
    color: color ?? 0x000000,
    alpha: alpha ?? 0.4
  }).stroke({
    width: strokeWidth ?? 2,
    color: strokeColor ?? 0xffffff,
    alpha: strokeAlpha ?? 0.9
  })
}

export const pixiText = ({ text, pos, style, anchor }: pixiTextProps): Text => {
  return new Text({
    text,
    anchor: anchor ?? 0,
    position: pos ?? { x: 0, y: 0 },
    resolution: style?.resolution ?? 4,
    scale: style?.scale ?? 1,
    alpha: style?.alpha ?? 1,
    style: {
      align: style?.align ?? "left",
      fill: style?.fill ?? 0xffffff,
      fontSize: style?.fontSize ?? 14,
      fontFamily: style?.fontFamily ?? "Courier New",
      fontWeight: style?.fontWeight ?? "bold",
      dropShadow: style?.dropShadow ? { distance: 0.5 } : false
    }
  })
}

type PixiButtonContent = {
  style: pixiTextStyle
  text: string
  anchor?: XY
  fillAlpha?: number
  fillColor?: number
  height?: number
  pos?: XY
  rounded?: number
  strokeAlpha?: number
  strokeColor?: number
  textAnchor?: XY
  textPos?: XY
  width?: number
}

export type PixiButton = {
  c: Container,
  onClick: undefined | (() => void),
  redraw: (content?: () => PixiButtonContent) => void
  bt: () => { boundary: Graphics, text: Text }
}

export type PixiButtonProps = {
  alpha?: number
  visible?: boolean
  interactive?: boolean
  content: () => PixiButtonContent
  onClick?: () => void
  onEnter?: () => void
  onLeave?: () => void
}

export const PixiButton = (props: PixiButtonProps): PixiButton => {

  const draw = ({
    anchor = { x: 0.5, y: 0.5 },
    fillAlpha,
    fillColor, height,
    pos = { x: 0, y: 0 },
    rounded = 5,
    strokeAlpha,
    strokeColor,
    style,
    text,
    textAnchor,
    textPos,
    width
  }: PixiButtonContent) => {

    const t = pixiText({ text, pos: textPos ?? pos, anchor: textAnchor ?? anchor, style })

    const b = pixiRect({
      x: width ? pos.x - (1 - anchor.x) * width : pos.x - (1 - anchor.x) * t.width - 7,
      y: height ? pos.y - (1 - anchor.y) * height : pos.y - (1 - anchor.y) * t.height - 5,
      w: width ?? t.width + 14,
      h: height ?? t.height + 10,
      rounded,
      style: {
        alpha: fillAlpha ?? 1,
        color: fillColor ?? 0x000000,
        strokeAlpha: strokeAlpha ?? 1,
        strokeColor: strokeColor ?? 0xffffff
      }
    })

    return [b, t]
  }

  const c = new Container({
    alpha: props.alpha ?? 1,
    children: draw(props.content()),
    interactive: props.interactive ?? true,
    visible: props.visible ?? true,
    ...props.onClick && { onpointerdown: props.onClick },
    ...props.onEnter && { onpointerenter: props.onEnter },
    ...props.onLeave && { onpointerleave: props.onLeave }
  })

  return {
    c,
    onClick: props.onClick,
    redraw: (content) => {
      c.removeChildren()
      c.addChild(...draw(content?.() ?? props.content()))
    },
    bt: () => {
      const boundary = c.children[0] as Graphics
      const text = c.children[1] as Text
      return { boundary, text }
    }
  }
}

const textureCache: Record<string, Record<string, any>> = {}

export const loadTexture = async (file: string): Promise<Record<string, any>> => {
  const textures = (await Assets.load(file)).textures
  textureCache[file] = textures
  return textures
}

export const loadTextureCached = (file: string): Record<string, any> | undefined => {
  return textureCache[file]
}

export const load = async (url: string) => Assets.load(url) as Promise<Texture>

export const arc = (target: Graphics, cx: number, cy: number, rx: number, ry: number, start: number, end: number, steps = 36) => {
  const step = (end - start) / steps
  for (let i = 0; i <= steps; i += 1) {
    const angle = start + step * i
    const x = cx + cos(angle) * rx
    const y = cy + sin(angle) * ry
    if (i === 0) target.moveTo(x, y)
    else target.lineTo(x, y)
  }
}
