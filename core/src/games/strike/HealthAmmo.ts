import { Entity, HDiv, HImg, HText, NPC, Position } from "@piggo-gg/core"

export const HealthAmmo = (): Entity => {
  let init = false

  const ammoText = HText({
    style: { fontSize: "38px", position: "relative", marginLeft: "6px", textAlign: "center" }
  })

  const healthText = HText({
    style: { fontSize: "38px", position: "relative", marginLeft: "6px", textAlign: "center", marginRight: "12px" }
  })

  const wrapper = HDiv({
    style: { left: "50%", bottom: "20px", display: "flex", alignItems: "center", transform: "translate(-50%, 0%)" }
  },
    HImg({
      src: "health.svg",
      style: { height: "36px", position: "relative", transform: "translate(0%, 0%)" }
    }),
    healthText,
    HImg({
      src: "bullet.svg",
      style: { height: "36px", position: "relative", transform: "translate(0%, 0%)" }
    }),
    ammoText
  )

  return Entity({
    id: "healthAmmo",
    components: {
      position: Position(),
      npc: NPC({
        behavior: (_, world) => {
          if (!init) {
            document.body.appendChild(wrapper)
            init = true
          }

          const pc = world.client?.character()
          if (!pc) return

          const { health, inventory } = pc.components
          if (!health || !inventory) return

          const activeItem = inventory.activeItem(world)
          const ammo = activeItem?.components.gun?.ammo ?? 0

          ammoText.textContent = `${ammo}`

          const hp = health.data.hp
          healthText.textContent = `${hp}`

          wrapper.style.visibility = world.client?.mobile?.horizontal() === false || world.client?.menu ? "hidden" : "visible"
        }
      }),
    }
  })
}
