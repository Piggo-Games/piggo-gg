import {
  Actions, Character, Collider, Debug, Input, Inventory, Move, Networked,
  PixiSkins, Player, Point, Position, Renderable, Shadow, SwitchTeam, Sword,
  Team, VolleyCharacterAnimations, VolleyCharacterDynamic, WASDInputMap
} from "@piggo-gg/core"
import { Dice } from "./Dice"

export const Gary = (player: Player): Character => {

  return Character({
    id: `gary-${player.id}`,
    components: {
      debug: Debug(),
      position: Position({
        x: player.components.team.data.team === 1 ? -80 : 80,
        y: 0,
        z: 0,
        speed: 120,
        gravity: 0,
        velocityResets: 1
      }),
      collider: Collider({ shape: "ball", radius: 6, group: "all" }),
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
          }
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
        SwitchTeam
      }),
      renderable: Renderable({
        anchor: { x: 0.55, y: 0.9 },
        scale: 1.2,
        zIndex: 4,
        interpolate: true,
        scaleMode: "nearest",
        skin: "dude-white",
        setup: async (renderable) => {
          // const desiredSkin = renderable.data.desiredSkin ?? skin
          await PixiSkins["dude-white"](renderable)
        },
        animationSelect: VolleyCharacterAnimations,
        onTick: VolleyCharacterDynamic
      })
    }
  })
}