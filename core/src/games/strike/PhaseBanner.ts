import { ceil, Entity, HDiv, HText, NPC, round, StrikeState, World } from "@piggo-gg/core"

const textMap: Record<StrikeState["phase"], (world: World, state: StrikeState) => string> = {
  "warmup": (world, { phaseChange }) => phaseChange ? `starting in ${ceil((phaseChange - world.tick) / 40)}` : "warmup",
  "round-start": ({ }) => "round starting",
  "round-play": () => "round in play",
  "round-end": () => "round over",
  "game-end": () => "game over"
}

export const PhaseBanner = () => {

  let init = false

  let readyText = HText({ text: "", style: { position: "relative", width: "200px", textAlign: "center" } })
  let phaseText = HText({ text: "warmup", style: { fontSize: "32px", position: "relative" } })

  const wrapper = HDiv({
    style: {
      left: "50%", top: "20px", transform: "translate(-50%)", display: "flex", alignItems: "center", flexDirection: "column"
    }
  },
    phaseText,
    readyText
  )

  return Entity({
    id: "PhaseBanner",
    components: {
      npc: NPC({
        behavior: (_, world) => {

          if (!init) {
            init = true
            document.body.appendChild(wrapper)
          }

          const visible = Boolean(world.client?.net.lobbyId)

          wrapper.style.visibility = visible ? "visible" : "hidden"

          if (!visible) return

          const state = world.state<StrikeState>()
          phaseText.textContent = textMap[state.phase](world, state)

          // # of ready players
          const players = world.players().filter(p => !p.id.includes("dummy"))
          const ready = players.filter(p => (p.components.pc.data.ready)).length

          readyText.textContent = `ready: ${ready}/${players.length}`
          readyText.style.visibility = state.phase === "warmup" && state.phaseChange === null ? "visible" : "hidden"
        }
      })
    }
  })
}
