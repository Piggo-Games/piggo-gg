import {
  Character, ClientSystemBuilder, Entity, Player,
  Position, Renderable, TeamColors, entries, pixiText
} from "@piggo-gg/core"

export const NametagSystem = ClientSystemBuilder({
  id: "NametagSystem",
  init: (world) => {

    const nametags: Record<string, Entity<Renderable | Position>> = {}
    const characters: Record<string, Character> = {}

    return {
      id: "NametagSystem",
      query: ["pc"],
      priority: 6,
      skipOnRollback: true,
      onTick: (entities: Player[]) => {

        // clean up
        for (const [characterId, nametag] of entries(nametags)) {

          if (!world.entity(nametag.id)) {
            delete nametags[characterId]
          }

          if (!world.entity(characterId)) {
            world.removeEntity(nametag.id)
            delete nametags[characterId]
          }
        }

        // clean up
        for (const [characterId, character] of entries(characters)) {
          if (character.removed) {
            world.removeEntity(nametags[characterId]?.id)

            delete nametags[characterId]
            delete characters[characterId]
          }
        }

        // new players
        for (const player of entities) {
          const character = player.components.controlling.getCharacter(world)
          if (!character) continue

          if (!nametags[character.id]) {
            const nametag = Nametag(player, character)
            world.addEntity(nametag)

            nametags[character.id] = nametag
            characters[character.id] = character
          }
        }
      }
    }
  }
})

const Nametag = (player: Player, character: Character) => {

  let { name } = player.components.pc.data
  let { team } = player.components.team.data

  const render = () => pixiText({
    text: name,
    style: { fill: TeamColors[team], fontSize: 12, dropShadow: true },
    anchor: { x: 0.45, y: 0 },
    pos: { x: 0, y: -44 },
  })

  return Entity<Position | Renderable>({
    id: `nametag-${player.id}`,
    components: {
      position: Position({ follows: character.id }),
      renderable: Renderable({
        zIndex: 10,
        interpolate: true,
        onTick: async ({ renderable }) => {
          if (!character.components.renderable) return
          renderable.visible = character.components.renderable.visible

          if (player.components.pc.data.name !== name || player.components.team.data.team !== team) {
            team = player.components.team.data.team
            name = player.components.pc.data.name

            renderable.c.removeChildren()
            renderable.c.addChild(render())
          }
        },
        setup: async (renderable) => {
          renderable.c.addChild(render())
        }
      })
    }
  })
}
