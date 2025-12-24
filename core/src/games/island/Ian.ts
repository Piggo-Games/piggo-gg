import {
  Action, Actions, Character, Collider, Debug, IslandState, Health, Input,
  Move, Networked, PixiSkins, Player, Point, Position, Renderable,
  Shadow, Team, VolleyCharacterAnimations, WASDInputMap, XY, cos, sin,
  Inventory, Sword
} from "@piggo-gg/core"

export const Ian = (player: Player): Character => {

  let glowing = false

  const ian = Character({
    id: `ian-${player.id}`,
    components: {
      debug: Debug(),
      position: Position({ x: -140, speed: 120, gravity: 0.3, velocityResets: 1 }),
      collider: Collider({ shape: "ball", radius: 6, group: "notme2" }),
      networked: Networked(),
      team: Team(player.components.team.data.team),
      shadow: Shadow(5),
      inventory: Inventory([Sword]),
      health: Health({ hp: 5, maxHp: 5 }),
      input: Input({
        joystick: ({ client }) => {
          const { power, angle } = client.controls.left

          const dir: XY = { x: cos(angle), y: sin(angle) }

          return { actionId: "moveAnalog", params: { dir, power, angle } }
        },
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
            if (!ian.components.position.data.standing || ian.components.position.data.velocity.z > 0) return
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
        moveAnalog: Action<{ dir: XY, power: number, angle: number }>("moveAnalog", ({ entity, params }) => {
          if (!entity) return

          const { position } = entity.components
          if (!position) return

          const power = params.power ?? 0
          if (power <= 0) return

          const dir = params.dir ?? { x: 0, y: 0 }

          if (dir.x > 0) position.data.facing = 1
          if (dir.x < 0) position.data.facing = -1

          position.setVelocity({
            x: dir.x * power * position.data.speed,
            y: dir.y * power * position.data.speed
          })
        }),
        point: Point,
        jump: Action("jump", () => {
          if (!ian.components.position?.data.standing) return
          ian.components.position.setVelocity({ z: 5 })
        }),
        rollDice: Action<{ pointingDelta: XY }>("rollDice", ({ params, world, entity }) => {
          if (!entity) return

          const state = world.state<IslandState>()
          if (state.shooter !== entity.id) return

          world.actions.push(world.tick + 1, "dice-1", { actionId: "roll", params: { shooterId: entity.id, pointingDelta: params.pointingDelta } })
          world.actions.push(world.tick + 1, "dice-2", { actionId: "roll", params: { shooterId: entity.id, pointingDelta: params.pointingDelta } })

          entity.components.renderable?.setAnimation("spike")
        }),
      }),
      renderable: Renderable({
        anchor: { x: 0.55, y: 0.9 },
        scale: 1.2,
        zIndex: 4,
        interpolate: true,
        scaleMode: "nearest",
        setup: PixiSkins["dude-white"],
        animationSelect: VolleyCharacterAnimations,
        onTick: ({ world, renderable }) => {
          const { position } = ian.components
          if (position.data.velocity.x !== 0) {
            renderable.setScale({ x: position.data.facing, y: 1 })
          }

          const state = world.state<IslandState>()
          if (!glowing && state.turnPhase === "players" && state.shooter === ian.id) {
            renderable.setGlow({ color: 0xffffff, outerStrength: 3 })
            glowing = true
          } else if (glowing && (state.turnPhase !== "players" || state.shooter !== ian.id)) {
            renderable.setGlow()
            glowing = false
          }
        }
      })
    }
  })

  return ian
}
