import {
  Action, Actions, Character, Collider, Debug, Input, Inventory, Move,
  Networked, PixiSkins, Player, Point, Position, Renderable, Shadow, Team,
  VolleyCharacterAnimations, VolleyCharacterDynamic, WASDInputMap
} from "@piggo-gg/core"
import { Dice } from "./Dice"

export const Gary = (player: Player): Character => {

  return Character({
    id: `gary-${player.id}`,
    components: {
      debug: Debug(),
      position: Position({ x: -140, speed: 120, gravity: 0.3, velocityResets: 1 }),
      collider: Collider({ shape: "ball", radius: 6, group: "1" }),
      networked: Networked(),
      team: Team(player.components.team.data.team),
      inventory: Inventory([Dice]),
      shadow: Shadow(5),
      input: Input({
        press: {
          ...WASDInputMap.press,
          "t": ({ hold }) => {
            if (hold) return
            return { actionId: "SwitchTeam" }
          },
          "g": ({ world, hold }) => {
            if (hold === 5) {
              world.debug = !world.debug
            }
          },
          " ": ({ hold }) => {
            if (hold) return
            return { actionId: "jump" }
          },
        },
        release: {
          "escape": ({ client }) => {
            client.menu = !client.menu
          },
          "mb1": ({ client, target }) => {
            if (target !== "canvas") return
            if (client.menu) client.menu = false
          }
        }
      }),
      actions: Actions({
        move: Move,
        point: Point,
        jump: Action("jump", ({ entity }) => {
          if (!entity?.components?.position?.data.standing) return
          entity.components.position.setVelocity({ z: 5 })
        }),
      }),
      renderable: Renderable({
        anchor: { x: 0.55, y: 0.9 },
        scale: 1.2,
        zIndex: 4,
        interpolate: true,
        scaleMode: "nearest",
        skin: "dude-white",
        setup: async (renderable) => {
          await PixiSkins["dude-white"](renderable)
        },
        animationSelect: VolleyCharacterAnimations,
        onTick: VolleyCharacterDynamic
      })
    }
  })
}
