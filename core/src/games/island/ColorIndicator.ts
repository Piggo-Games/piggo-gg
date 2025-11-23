import { BuildSettings, Entity, HDiv, NPC, World } from "@piggo-gg/core"

export const ColorIndicator = (world: World) => {

  let init = false

  const div = HDiv({
    style: {
      backgroundColor: "white",
      width: "40px",
      height: "40px",

      left: "50%",
      bottom: "16px",

      transform: "translate(-50%, -50%)",
      borderRadius: "6px",
      border: "3px solid black"
    }
  })

  return Entity({
    id: "ColorIndicator",
    components: {
      npc: NPC({
        behavior: (_, world) => {
          if (!world.client) return

          if (!init) {
            init = true
            document.getElementById("canvas-parent")?.appendChild(div)
          }

          const { blockColor } = world.settings<BuildSettings>()

          div.style.backgroundColor = blockColor === "white" ? "#fae79d" : blockColor
        }
      })
    }
  })
}
