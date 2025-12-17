import {
  Action, Actions, Character, Collider, Debug, GambaState, Health, Input, Inventory, Move,
  Networked, PixiSkins, Player, Point, Position, Renderable, Shadow, Team,
  VolleyCharacterAnimations, VolleyCharacterDynamic, WASDInputMap
} from "@piggo-gg/core"
import { Dice } from "./Dice"

export const Gary = (player: Player): Character => {

  let glowing = false

  const gary = Character({
    id: `gary-${player.id}`,
    components: {
      debug: Debug(),
      position: Position({ x: -140, speed: 120, gravity: 0.3, velocityResets: 1 }),
      collider: Collider({ shape: "ball", radius: 6, group: "notme2" }),
      networked: Networked(),
      team: Team(player.components.team.data.team),
      inventory: Inventory([Dice(1), Dice(2)]),
      shadow: Shadow(5),
      health: Health({ hp: 5, maxHp: 5 }),
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
          " ": () => {
            if (!gary.components.position.data.standing || gary.components.position.data.velocity.z > 0) return
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
        jump: Action("jump", () => {
          if (!gary.components.position?.data.standing) return
          gary.components.position.setVelocity({ z: 5 })
        }),
      }),
      renderable: Renderable({
        anchor: { x: 0.55, y: 0.9 },
        scale: 1.2,
        zIndex: 4,
        interpolate: true,
        scaleMode: "nearest",
        setup: async (renderable) => {
          await PixiSkins["dude-white"](renderable)
        },
        animationSelect: VolleyCharacterAnimations,
        onTick: (props) => {
          VolleyCharacterDynamic(props)

          const { world, renderable } = props

          const state = world.state<GambaState>()
          if (!glowing && state.turnPhase === "players" && state.shooter === gary.id) {
            renderable.setGlow({ color: 0xffffff, outerStrength: 3 })
            console.log("glow set on", gary.id)
            glowing = true
          } else if (glowing && (state.turnPhase !== "players" || state.shooter !== gary.id)) {
            renderable.setGlow()
            console.log("glow removed on", gary.id)
            glowing = false
          }
        }
      })
    }
  })

  return gary
}
