import {
  DefaultWorld, GameBuilder, isMobile, PixiRenderer, ThreeRenderer, World
} from "@piggo-gg/core"

export type PiggoGGOptions = {
  exposeWorld?: boolean
  onWorldReady?: (world: World) => void
}

export type PiggoGGProps = {
  gameBuilder: GameBuilder
  options?: PiggoGGOptions
}

export type PiggoGG = (props: PiggoGGProps) => void

const ensureCanvasParent = (canvas: HTMLCanvasElement): HTMLDivElement => {
  let canvasParent = document.getElementById("canvas-parent") as HTMLDivElement | null
  if (!canvasParent) {
    canvasParent = document.createElement("div")
    canvasParent.id = "canvas-parent"
    canvasParent.style.position = "relative"

    const parent = canvas.parentElement ?? document.body
    parent.insertBefore(canvasParent, canvas)
  }

  if (canvasParent.style.position === "") {
    canvasParent.style.position = "relative"
  }

  if (canvasParent !== canvas.parentElement) {
    canvasParent.appendChild(canvas)
  }

  return canvasParent
}

const ensureAudioElement = (): HTMLAudioElement => {
  let audioElement = document.getElementById("sound") as HTMLAudioElement | null
  if (!audioElement) {
    audioElement = document.createElement("audio")
    audioElement.id = "sound"
    audioElement.preload = "auto"
    document.body.appendChild(audioElement)
  }

  const hasSource = Boolean(audioElement.querySelector("source")) || Boolean(audioElement.src)
  if (!hasSource) {
    const source = document.createElement("source")
    source.src = "/silent.mp3"
    source.type = "audio/mp3"
    audioElement.appendChild(source)
  }

  return audioElement
}

const setupAudioUnlock = (world: World, target: HTMLElement) => {
  const audioElement = ensureAudioElement()

  target.addEventListener("pointerup", () => {
    if (!world.client) return
    audioElement.play().then(() => {
      world.client!.sound.ready = true
    }).catch(() => {})
  }, { capture: true, once: true })
}

export const PiggoGG: PiggoGG = ({ gameBuilder, options }) => {
  const canvas = document.getElementById("piggo-canvas") as HTMLCanvasElement | null
  if (!canvas) {
    throw new Error('PiggoGG requires <canvas id="piggo-canvas"> in the document.')
  }

  canvas.ontouchend = (event) => event.preventDefault()
  if (isMobile()) canvas.style.border = "none"

  const canvasParent = ensureCanvasParent(canvas)

  // const renderer = options?.renderer ?? "both"
  // const usePixi = renderer !== "three"
  // const useThree = renderer !== "pixi"

  const world = DefaultWorld({
    three: ThreeRenderer(), pixi: PixiRenderer()
  })

  world.games[gameBuilder.id] = gameBuilder
  world.setGame(gameBuilder.id)

  if (options?.exposeWorld ?? true) {
    (window as { world?: World }).world = world
  }

  setupAudioUnlock(world, canvasParent)

  options?.onWorldReady?.(world)
}
