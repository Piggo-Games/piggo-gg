import { CSS, HtmlButton, HtmlDiv, HtmlImg, HtmlText } from "@piggo-gg/core"

type HChild = HTMLElement | SVGSVGElement

type HParams = {
  id?: string
  style?: CSS
  src?: string
  text?: string
  onClick?: (button: HTMLButtonElement) => void
  onRelease?: (button: HTMLButtonElement) => void
  onHover?: (button: HTMLButtonElement) => void
  onHoverOut?: (button: HTMLButtonElement) => void
}

export const HText = ({ id, style, text }: HParams = {}, child1?: HTMLElement): HTMLDivElement => {
  const d = HtmlText({
    text: text ?? "",
    style: style ?? {}
  })

  if (id) d.id = id
  if (child1) d.appendChild(child1)

  return d
}

export const HButton = ({ id, style, onClick, onRelease, onHover, onHoverOut, text }: HParams = {},
  child1?: HTMLElement, child2?: HTMLElement, child3?: HTMLElement, child4?: HTMLElement, child5?: HTMLElement
): HTMLButtonElement => {
  const b = HtmlButton({
    style: style ?? {},
    onClick: () => { onClick?.(b) },
    onRelease: () => { onRelease?.(b) },
    onHover: () => { onHover?.(b) },
    onHoverOut: () => { onHoverOut?.(b) }
  })

  if (text) b.textContent = text

  if (id) b.id = id

  if (child1) b.appendChild(child1)
  if (child2) b.appendChild(child2)
  if (child3) b.appendChild(child3)
  if (child4) b.appendChild(child4)
  if (child5) b.appendChild(child5)

  return b
}

export const HImg = ({ id, style, src }: HParams = {}, child1?: HTMLElement): HTMLImageElement => {
  const i = HtmlImg(src ?? "", style ?? {})

  if (id) i.id = id
  if (child1) i.appendChild(child1)

  return i
}

export const HDiv = ({ id, style, text }: HParams = {},
  child1?: HChild, child2?: HChild, child3?: HChild, child4?: HChild, child5?: HChild
): HTMLDivElement => {
  const d = HtmlDiv(style ?? {})

  if (text) d.textContent = text

  if (id) d.id = id

  if (child1) d.appendChild(child1)
  if (child2) d.appendChild(child2)
  if (child3) d.appendChild(child3)
  if (child4) d.appendChild(child4)
  if (child5) d.appendChild(child5)

  return d
}

export const HSVG = (viewBox: `0 ${number} ${number} ${number}`, content: string): SVGSVGElement => {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg")
  svg.setAttribute("xmlns", "http://www.w3.org/2000/svg")
  svg.setAttribute("viewBox", viewBox)
  svg.setAttribute("fill", "white")
  svg.setAttribute("width", "24px")
  svg.setAttribute("height", "24px")
  svg.innerHTML = content
  return svg
}
