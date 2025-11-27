import { Renderable, RenderableProps, pixiText } from "@piggo-gg/core"

export type TextBoxProps = RenderableProps & {
  text?: string
  fontSize?: number
  color?: number
  dropShadow?: boolean
  padding?: number
  boxOutline?: boolean
}

export const TextBox = (props: TextBoxProps): Renderable => {
  const { text = "", color = 0x55FF00, fontSize = 16, dropShadow = true } = props

  return Renderable({
    ...props,
    setup: async (r: Renderable) => {
      r.c = pixiText({ text, style: { fill: color, fontSize, dropShadow } })
    }
  })
}
