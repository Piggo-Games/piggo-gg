import { Character, Controlling, Player, SystemBuilder } from "@piggo-gg/core"

export type SpawnSystemProps = {
  spawner: (player: Player) => Character
  pos: { x: number, y: number, z: number }
}

export const SpawnSystem = ({ spawner, pos }: SpawnSystemProps) => SystemBuilder<"SpawnSystem">({
  id: "SpawnSystem",
  init: (world) => {

    const spawned: Record<string, string> = {}

    return {
      id: "SpawnSystem",
      query: ["pc"],
      priority: 5,
      onTick: (players: Player[]) => {

        // cleanup
        for (const playerId in spawned) {
          if (!world.entities[playerId]) {
            world.removeEntity(spawned[playerId])
            delete spawned[playerId]
          }
        }

        // spawn character
        players.forEach((player) => {
          const character = player.components.controlling.getCharacter(world)

          if (!character) {
            const character = spawner(player)
            player.components.controlling = Controlling({ entityId: character.id })

            world.addEntity(character)
            spawned[player.id] = character.id

            return
          }

          if (!character.components.health) return

          const { died } = character.components.health.data
          if (died === null) return

          if (died + 60 < world.tick) {

            const { position, health } = character.components

            // reset health
            health.revive()

            // reset position
            if (!player.id.includes("dummy")) position.setPosition(pos)
          }
        })
      }
    }
  }
})
