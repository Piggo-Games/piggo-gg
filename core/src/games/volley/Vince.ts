import {
  Action, Actions, ChangeSkin, Character, Collider, Debug, Input,
  Move, Networked, PixiSkins, Player, Position, Renderable, Shadow,
  Team, VolleyCharacterAnimations, VolleyCharacterDynamic, WASDInputMap
} from "@piggo-gg/core"
import { Spike } from "./Spike"

export const Vince = (player: Player) => Character({
  id: `vince-${player.id}`,
  components: {
    debug: Debug(),
    position: Position({
      y: 0, x: player.components.team.data.team === 1 ? 0 : 400,
      velocityResets: 1, speed: 125, gravity: 0.3
    }),
    networked: Networked(),
    collider: Collider({ shape: "ball", radius: 4, group: "notself" }),
    team: Team(player.components.team.data.team),
    input: Input({
      release: {
        "escape": ({ client }) => {
          client.menu = !client.menu
        },
        "mb1": ({ target, client }) => {
          if (target !== "canvas") return

          if (client.menu) client.menu = false
        }
      },
      press: {
        ...WASDInputMap.press,
        " ": ({ hold }) => {
          if (hold) return
          return { actionId: "jump" }
        },
        "mb1": ({ hold, mouse, world, entity }) => {
          if (hold) return
          const { position } = entity.components
          if (!position) return

          const from = position.xyz()
          const target = { x: mouse.x, y: mouse.y }
          world.actions.push(world.tick + 3, entity.id, { actionId: "spike", params: { from, target } })

          return
        }
      }
    }),
    actions: Actions({
      move: Move,
      spike: Spike(),
      jump: Action("jump", ({ entity }) => {
        if (!entity?.components?.position?.data.standing) return
        entity.components.position.setVelocity({ z: 6 })
      }),
      changeSkin: ChangeSkin
    }),
    shadow: Shadow(5),
    renderable: Renderable({
      anchor: { x: 0.55, y: 0.9 },
      scale: 1.2,
      zIndex: 4,
      interpolate: true,
      scaleMode: "nearest",
      skin: (player.components.pc.data.name.startsWith("noob")) ? "dude-white" : "ghost",
      setup: async (r) => {
        await PixiSkins[r.data.desiredSkin ?? "dude-white"](r)
      },
      animationSelect: VolleyCharacterAnimations,
      onTick: VolleyCharacterDynamic
    })
  }
})
