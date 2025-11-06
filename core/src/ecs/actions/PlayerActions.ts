import { Action, Controlling } from "@piggo-gg/core"

export const ControlEntity: Action = Action("ControlEntity", ({ entity, player }) => {
  if (!entity || !player) return

  player.components.controlling = Controlling({ entityId: entity.id })
})

export const SwitchTeam = Action("SwitchTeam", ({ entity, world }) => {
  if (!entity) return

  const { team, controlling } = entity.components
  if (!team) return

  team.switchTeam()

  const characterTeam = controlling?.getCharacter(world)?.components.team
  if (characterTeam) characterTeam.switchTeam()
}, 10)

export const Ready = Action("Ready", ({ player, world }) => {
  if (!player) return

  const state = world.state<{ phase: string }>()
  if (state.phase !== "warmup") return

  player.components.pc.data.ready = !player.components.pc.data.ready
}, 10)
