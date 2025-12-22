import { Entity, Position, Renderable, pixiText, values, load, wrapText, Actions, Debug } from "@piggo-gg/core"
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

          const selected = state.selectedAbility === id
          renderable.setOutline({ color: 0x8aff8a, thickness: selected ? 2 : 0 })
          if (selected) return

          console.log("hovering", hovering, state.shooter, client.character(), state.rollQueued)

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
            hovering = true
          }
          r.c.onmouseleave = () => {
            hovering = false
          }
          r.c.onpointerdown = () => {
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
            style: { fontSize: 3.5, fill: 0x1c64f2, align: "center", resolution: 16, dropShadow: true }
          })

          r.c.addChild(titleText, descriptionText, manaText)
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

export const RallyScroll = () => Scroll(GunnerAbilities[0])
export const SliceScroll = () => Scroll(GunnerAbilities[1])
