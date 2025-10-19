export const piggoVersion: `0.${number}.${number}` = "0.42.4"

export const isMobile = (): boolean => /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)

export const { keys, values, entries } = Object

const textInputSelector =
  'textarea,[contenteditable]:not([contenteditable="false"]),input:not([type]),' +
  'input[type="text"],input[type="search"],input[type="url"],input[type="tel"],' +
  'input[type="email"],input[type="password"],input[type="number"]'

export const isTypingEvent = (e: Event) => {
  const target = e.composedPath ? e.composedPath()[0] : e.target
  if (!(target instanceof Element)) return false

  const editable = target.closest<HTMLInputElement>(textInputSelector)
  if (!editable) return false

  if (editable.matches('input,textarea')) {
    if (editable.readOnly || editable.disabled) return false
  }
  return true
}

export const element = <X extends HTMLElement>(id: string): X | null => {
  return document.getElementById(id) as X | null
}

export const screenWH = () => {
  // @ts-expect-error
  const standalone = window.navigator.standalone ?? false
  const height = (document.fullscreenElement || standalone) ? window.outerHeight : window.innerHeight

  return { w: window.innerWidth, h: height }
}

export const getBrowser = () => {
  const userAgent = navigator.userAgent
  if (userAgent.indexOf("Chrome") > -1) return "chrome"
  if (userAgent.indexOf("Safari") > -1) return "safari"
  if (userAgent.indexOf("Firefox") > -1) return "firefox"
  return undefined
}

export const replaceCanvas = () => {
  const canvas = document.getElementById("canvas") as HTMLCanvasElement | undefined

  const newCanvas = document.createElement("canvas")
  newCanvas.id = "canvas"

  if (isMobile()) newCanvas.style.border = "none"

  if (canvas) {
    canvas.replaceWith(newCanvas)
  } else {
    document.body.appendChild(newCanvas)
  }

  return newCanvas
}
