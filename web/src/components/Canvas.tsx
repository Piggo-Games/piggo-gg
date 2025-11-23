import {
  DefaultWorld, isMobile, ThreeRenderer, World, PixiRenderer
} from "@piggo-gg/core"
import { useEffect } from "react"

export type CanvasProps = {
  setWorld: (_: World) => void
}

export const Canvas = ({ setWorld }: CanvasProps) => {

  useEffect(() => {
    const canvas = document.getElementById("canvas") as HTMLCanvasElement
    canvas.ontouchend = (e) => e.preventDefault()

    const mobile = isMobile()
    if (mobile) canvas.style.border = "none"

    setWorld(DefaultWorld({
      game: mobile ? "island" : "lobby",
      three: ThreeRenderer(),
      pixi: PixiRenderer()
    }))
  }, [])

  return (
    <div id="canvas-parent" style={{ position: "relative" }}>
      <canvas id="canvas" />
    </div>
  )
}
