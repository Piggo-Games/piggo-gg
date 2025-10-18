import { Entity, HDiv, NPC, Position } from "@piggo-gg/core"

export const Scoreboard = () => {

  let init = false

  const wrapper = HDiv({
    style: {
      left: "50%",
      top: "50%",
      transform: "translate(-50%, -50%)",
      // display: "flex",
      border: "2px solid blue",

      width: "400px",
      height: "300px",
      visibility: "hidden"
    }
  })

  const scoreboard = Entity({
    id: "scoreboard",
    components: {
      position: Position(),
      npc: NPC({
        behavior: (_, world) => {
          if (!init) {
            console.log("Scoreboard initialized")
            init = true
            document.body.appendChild(wrapper)
          }

          wrapper.style.visibility = world.client?.bufferDown.get("tab") ? "visible" : "hidden"
        }
      })
    }
  })

  return scoreboard
}
