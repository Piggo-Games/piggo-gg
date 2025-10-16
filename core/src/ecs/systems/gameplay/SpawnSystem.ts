import { Character, Controlling, Player, SystemBuilder } from "@piggo-gg/core"

type CharacterSpawner = (player: Player) => Character

export const SpawnSystem = (spawner: CharacterSpawner) => SystemBuilder<"SpawnSystem">({
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
          if (died === undefined) return

          if (died + 60 < world.tick) {

            const { position, health } = character.components

            // reset health
            health.data.hp = health.data.maxHp

            // reset died
            health.data.died = undefined

            // reset position
            if (!player.id.includes("dummy")) position.setPosition({ x: 8, y: 8 })
            position.setPosition({ z: 2 })
          }
        })
      }
    }
  }
})
