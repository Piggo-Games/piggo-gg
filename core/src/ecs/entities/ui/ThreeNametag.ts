import { ClientSystemBuilder, ThreeText, min, Player, values, CraftSettings, World } from "@piggo-gg/core"
import { Group } from "three"

export type ThreeNametag = {
  group: Group
  update: (world: World, delta: number) => void
}

export const ThreeNametag = (player: Player): ThreeNametag => {
  const group = new Group()
  const text = ThreeText()

  group.add(text)

  return {
    group,
    update: (world: World, delta: number) => {
      const character = player.components.controlling.getCharacter(world)
      if (!character) return

      const pc = world.client?.character()
      if (pc) {
        if (pc.components.position.data.flying && !character.components.position.data.flying) {
          group.visible = false
        } else {
          group.visible = player.components.team.data.team === pc.components.team.data.team
        }
      }

      const { position, health } = character.components

      if (health?.dead()) {
        group.visible = false
        return
      }

      const interpolated = position.interpolate(world, delta)

      group.position.set(interpolated.x, interpolated.z + 0.62, interpolated.y)

      // update text if needed
      const { name } = player.components.pc.data
      if (text.text !== name) {
        text.text = name
        text.sync()
      }

      // scale the size
      const dist = world.three?.camera.c.position.distanceTo(group.position) || 1
      const scale = 0.5 + min(5, dist * 0.4)
      group.scale.set(scale, scale, scale)

      // orient toward camera
      const camera = world.three?.camera.c
      if (camera) group.lookAt(camera.position)
    }
  }
}

export const ThreeNametagSystem = ClientSystemBuilder({
  id: "ThreeNametagSystem",
  init: (world) => {

    const nametags: Record<string, ThreeNametag> = {}

    const settings = world.settings<CraftSettings>()

    return {
      id: "ThreeNametagSystem",
      query: [],
      priority: 10,
      onTick: () => {
        for (const nametag of values(nametags)) {
          nametag.group.visible = settings.showNametags
        }
      },
      onRender: (_, delta) => {
        if (!world.three) return

        if (!settings.showNametags) return

        const players = world.players()

        // cleanup old nametags
        for (const id in nametags) {
          if (!world.entity(id)) {
            const nametag = nametags[id]
            if (nametag) {
              world.three.scene.remove(nametag.group)
              delete nametags[id]
            }
          }
        }

        for (const player of players) {

          if (player.id === world.client?.playerId()) continue

          // new player
          if (!nametags[player.id]) {
            const nametag = ThreeNametag(player)
            nametags[player.id] = nametag

            world.three.scene.add(nametag.group)
          }

          // update
          nametags[player.id]?.update(world, delta)
        }
      }
    }
  }
})
