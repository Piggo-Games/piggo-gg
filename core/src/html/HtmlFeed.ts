import { Entity, entries, HButton, HDiv, HImg, HText, NPC, Player, Position, Three } from "@piggo-gg/core"

export const HtmlFeed = (): Entity => {
  let init = false

  const duration = 120

  type FeedKey = `${number}-${string}-${string}-${boolean}`
  let feedRecord: Record<FeedKey, number> = {}

  const wrapper = HDiv({
    style: {
      width: "fit-content",
      right: "15px",
      top: "15px",
      flexDirection: "column",
      display: "flex",
      alignItems: "flex-end"
    }
  })

  return Entity({
    id: "htmlFeed",
    components: {
      position: Position(),
      npc: NPC({
        behavior: (_, world) => {
          if (!init) {
            document.body.appendChild(wrapper)
            init = true
          }

          for (const player of world.players()) {
            const character = player.components.controlling.getCharacter(world)
            if (!character) continue

            const { died, diedFrom, diedReason } = character.components.health?.data ?? {}

            if (died && diedFrom && diedReason) {
              const headshot = diedReason === "headshot"

              const key: FeedKey = `${died}-${player.id}-${diedFrom}-${headshot}`
              if (feedRecord[key]) continue

              feedRecord[key] = world.tick

              const p1 = world.players().find(p => diedFrom.includes(p.id))
              if (!p1) continue

              const item = FeedItem(p1, player, headshot, world.client?.playerId())
              wrapper.appendChild(item)
            }
          }
        }
      }),
      three: Three({
        onRender: ({ world, delta }) => {
          const ratio = delta / 25

          // Remove old items
          for (const [key, tick] of entries(feedRecord)) {

            const timer = world.tick + ratio - tick

            if (timer > (duration + 40)) {
              delete feedRecord[key as FeedKey]
              if (wrapper.children.length > 0) {
                wrapper.removeChild(wrapper.children[0])
              }
            } else if (timer > duration) {
              const index = Object.keys(feedRecord).indexOf(key)

              const item = wrapper.children[index] as HTMLElement
              if (item) {
                item.style.opacity = `${1 - (timer - duration) / 40}`
                item.style.marginTop = `${6 - (timer - duration) / 40 * 42}px`
              }
            }
          }
        }
      })
    }
  })
}

const FeedItem = (p1: Player, p2: Player, headshot: boolean, localPlayer: string | undefined) => {
  return HButton({
    style: {
      position: "relative",
      width: "fit-content",
      height: "36px",
      display: "flex",
      alignItems: "center",
      marginTop: "6px"
    }
  },
    HText({
      style: {
        position: "relative",
        color: p1.id === localPlayer ? "#77ee99" : "white",
        fontSize: "22px",
        marginRight: "8px",
        marginLeft: "10px"
      },
      text: p1.components.pc.data.name,
    }),
    HImg({
      src: "pistol.svg",
      style: {
        width: "32px",
        position: "relative",
        transform: "translate(0%, 0%)",
        marginRight: headshot ? "2px" : "8px"
      }
    }),
    headshot ? HImg({
      src: "headshot.svg",
      style: {
        width: "28px",
        position: "relative",
        transform: "translate(0%, 0%)",
        marginRight: "6px"
      }
    }) : undefined,
    HText({
      style: {
        position: "relative",
        color: "white",
        fontSize: "22px",
        marginRight: "10px"
      },
      text: p2.components.pc.data.name,
    })
  )
}
