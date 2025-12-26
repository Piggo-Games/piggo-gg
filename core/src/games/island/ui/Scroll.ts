import {
  Actions, Debug, Entity, Html, HtmlDiv, HtmlText, Position, Renderable,
  load, pixiText, values, wrapText
} from "@piggo-gg/core"
import { Sprite } from "pixi.js"
import type { IslandState } from "../Island"

export type ScrollProps = {
  id: string
  title: string
  description: string
  manaCost: number
  position?: { x?: number, y?: number }
}

export const Scroll = ({ id, title, description, manaCost, position }: ScrollProps): Entity => {

  let hovering = false

  const x = position?.x ?? 0
  const y = position?.y ?? 90

  const textColor = 0x3b2c1c

  const scroll = Entity<Renderable>({
    id: `scroll-${id}`,
    components: {
      debug: Debug(),
      position: Position({ x, y }),
      actions: Actions({
        selectAbility: ({ params, world }) => {
          const state = world.state<IslandState>()
          state.selectedAbility = params.abilityId
        }
      }),
      renderable: Renderable({
        zIndex: 2,
        scale: 2.2,
        anchor: { x: 0.53, y: 1 },
        scaleMode: "nearest",
        onRender: ({ renderable, world, client }) => {
          const state = world.state<IslandState>()

          if (world.client!.menu) hovering = false

          const selected = state.selectedAbility === id
          renderable.setOutline({ color: 0x8aff8a, thickness: selected ? 2 : 0 })
          if (selected) return

          if (hovering && (state.shooter === client.character()?.id && !state.rollQueued)) {
            renderable.setOverlay({ color: 0xffffaa, alpha: 0.2 })
          } else {
            delete renderable.filters["overlay"]
            renderable.c.filters = values(renderable.filters)
          }
        },
        setup: async (r, _, world) => {
          const t = await load("scroll.png")

          r.c = new Sprite(t)

          r.c.eventMode = "dynamic"

          r.c.onmouseenter = () => {
            if (world.client!.menu) return
            hovering = true
          }
          r.c.onmouseleave = () => {
            if (world.client!.menu) return
            hovering = false
          }
          r.c.onpointerdown = () => {
            const state = world.state<IslandState>()
            if (state.shooter !== world.client!.character()?.id) return
            if (state.rollQueued) return

            if (world.client!.menu) return

            world.actions.push(world.tick + 1, scroll.id, { actionId: "selectAbility", params: { abilityId: id } })

            world.client!.clickThisFrame.set(world.tick)
          }

          const titleText = pixiText({
            text: title,
            pos: { x: 0, y: -30 },
            anchor: { x: 0.5, y: 0 },
            style: { fontSize: 5, fill: textColor, align: "center", resolution: 16 }
          })

          const descriptionText = pixiText({
            text: wrapText(description, 20),
            pos: { x: 0, y: -20 },
            anchor: { x: 0.5, y: 0 },
            style: { fontSize: 2.8, fill: textColor, align: "center", resolution: 16 }
          })

          const manaText = pixiText({
            text: `${manaCost} mana`,
            pos: { x: 0, y: -6 },
            anchor: { x: 0.5, y: 0 },
            style: { fontSize: 3.5, fill: 0x1c64f2, align: "center", resolution: 16 }
          })

          r.c.addChild(titleText, descriptionText, manaText)
        }
      })
    }
  })
  return scroll
}

export const Scroll2 = ({ id, title, description, manaCost, position }: ScrollProps): Entity => {

  let hovering = false
  let card: HtmlDiv | undefined
  let hoverOverlay: HtmlDiv | undefined

  const x = position?.x ?? 0
  const y = position?.y ?? 90

  const textColor = "#3b2c1c"
  const baseBackground = "linear-gradient(180deg, rgba(255, 248, 222, 0.98) 0%, rgba(235, 208, 152, 0.98) 100%)"
  const hoverBackground = "linear-gradient(180deg, rgba(255, 252, 232, 0.98) 0%, rgba(241, 219, 168, 0.98) 100%)"
  const baseTilt = "rotate(-1deg)"
  const hoverTilt = "rotate(0deg)"

  const scroll = Entity<Html>({
    id: `scroll2-${id}`,
    components: {
      debug: Debug(),
      // position: Position({ x, y, screenFixed: true }),
      actions: Actions({
        selectAbility: ({ params, world }) => {
          const state = world.state<IslandState>()
          state.selectedAbility = params.abilityId
        }
      }),
      html: Html({
        onTick: (world) => {
          if (!card || !hoverOverlay) return

          const client = world.client
          if (!client) return

          if (client.menu) hovering = false

          const state = world.state<IslandState>()
          const selected = state.selectedAbility === id

          card.style.outline = selected ? "2px solid #8aff8a" : "none"
          card.style.outlineOffset = selected ? "2px" : "0px"

          if (selected) {
            hoverOverlay.style.visibility = "hidden"
            card.style.backgroundImage = baseBackground
            card.style.transform = baseTilt
            return
          }

          const canHover = hovering && state.shooter === client.character()?.id && !state.rollQueued
          hoverOverlay.style.visibility = canHover ? "visible" : "hidden"
          card.style.backgroundImage = canHover ? hoverBackground : baseBackground
          card.style.transform = canHover ? hoverTilt : baseTilt
        },
        init: (world) => {
          const xOffset = Math.round(x * 2.2)
          const yOffset = Math.round(y)

          const wrapper = HtmlDiv({
            left: "50%",
            bottom: `calc(env(safe-area-inset-bottom))`, // calc(${yOffset}px + 
            marginLeft: `${xOffset}px`,
            transform: "translate(-50%, 0%)",
            width: "200px",
            height: "240px",
            pointerEvents: "auto"
          }, `scroll2-${id}`)

          const shadow = HtmlDiv({
            position: "absolute",
            left: "6px",
            top: "6px",
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.18)",
            borderRadius: "12px",
            pointerEvents: "none",
            zIndex: 0
          })

          card = HtmlDiv({
            position: "absolute",
            left: "0px",
            top: "0px",
            width: "200px",
            height: "240px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "flex-start",
            gap: "8px",
            paddingTop: "16px",
            paddingLeft: "12px",
            paddingRight: "12px",
            paddingBottom: "22px",
            boxSizing: "border-box",
            backgroundColor: "#f3e2b7",
            backgroundImage: baseBackground,
            border: "2px solid #7d5b2e",
            borderBottom: "8px solid #5b3c1a",
            borderRadius: "12px",
            cursor: "pointer",
            pointerEvents: "auto",
            transition: "background 0.08s ease, outline 0.08s ease, transform 0.08s ease",
            transform: baseTilt,
            zIndex: 1
          })

          hoverOverlay = HtmlDiv({
            position: "absolute",
            top: "0px",
            left: "0px",
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(255, 255, 170, 0.2)",
            borderRadius: "12px",
            visibility: "hidden",
            pointerEvents: "none"
          })

          const content = HtmlDiv({
            position: "relative",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "flex-start",
            gap: "6px",
            width: "100%",
            height: "100%",
            pointerEvents: "none"
          })

          const titleText = HtmlText({
            text: title,
            style: {
              position: "relative",
              width: "100%",
              textAlign: "center",
              fontSize: "18px",
              lineHeight: "20px",
              color: textColor,
              textShadow: "none"
            }
          })

          const descriptionText = HtmlText({
            text: wrapText(description, 20),
            style: {
              position: "relative",
              width: "100%",
              textAlign: "center",
              fontSize: "13px",
              lineHeight: "16px",
              color: textColor,
              textShadow: "none",
              whiteSpace: "pre-line"
            }
          })

          const manaText = HtmlText({
            text: `${manaCost} mana`,
            style: {
              position: "relative",
              width: "100%",
              textAlign: "center",
              fontSize: "14px",
              color: "#1c64f2",
              textShadow: "none"
            }
          })

          const grip = HtmlDiv({
            position: "absolute",
            bottom: "-12px",
            left: "50%",
            transform: "translate(-50%, 0%)",
            width: "120px",
            height: "18px",
            backgroundColor: "rgba(111, 77, 41, 0.95)",
            border: "2px solid #5a3818",
            borderRadius: "10px",
            pointerEvents: "none"
          })

          card.appendChild(hoverOverlay)
          content.appendChild(titleText)
          content.appendChild(descriptionText)
          content.appendChild(manaText)
          card.appendChild(content)
          card.appendChild(grip)

          card.onmouseenter = () => {
            if (world.client?.menu) return
            hovering = true
          }

          card.onmouseleave = () => {
            if (world.client?.menu) return
            hovering = false
          }

          card.onpointerdown = () => {
            const state = world.state<IslandState>()
            if (state.shooter !== world.client?.character()?.id) return
            if (state.rollQueued) return
            if (world.client?.menu) return

            world.actions.push(world.tick + 1, scroll.id, { actionId: "selectAbility", params: { abilityId: id } })
            world.client?.clickThisFrame.set(world.tick)
          }

          wrapper.appendChild(shadow)
          wrapper.appendChild(card)

          return wrapper
        }
      })
    }
  })

  return scroll
}

const GunnerAbilities: ScrollProps[] = [
  {
    id: "rally",
    title: "Rally",
    description: "allies take 1 less DMG per hit until your next turn",
    manaCost: 1,
    position: { x: -46, y: 130 }
  },
  {
    id: "slice",
    title: "Slice",
    description: "enemies take 1D6 extra DMG per hit until your next turn",
    manaCost: 1,
    position: { x: 46, y: 130 }
  }
]

export const RallyScroll = () => Scroll2(GunnerAbilities[0])
export const SliceScroll = () => Scroll2(GunnerAbilities[1])
