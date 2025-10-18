import { Actions, Controlling, Entity, Networked, PC, Team, TeamNumber, switchTeam } from "@piggo-gg/core"

export type PlayerProps = {
  id: string
  name?: string
  team?: TeamNumber
  leader?: boolean
}

export type Player = Entity<PC | Controlling | Actions | Team>

export const Player = ({ id, name, team, leader }: PlayerProps): Player => Entity<PC | Controlling | Actions | Team>({
  id: id,
  persists: true,
  components: {
    networked: Networked(),
    pc: PC({ name: name ?? "noob", leader: leader ?? false }),
    controlling: Controlling(),
    actions: Actions({ switchTeam }),
    team: Team(team ?? 1)
  }
})

export const DummyPlayer = () => Player({ id: "player-dummy", name: "dummy1", team: 1 })
export const DummyPlayer2 = () => Player({ id: "player-dummy-2", name: "dummy2", team: 2 })
