import {
  Component, Entity, max, SystemBuilder, ValidSounds, World
} from "@piggo-gg/core"

export type Health = Component<"health", {
  hp: number,
  maxHp: number,
  died: undefined | number,
  diedFrom: undefined | string
  diedReason: undefined | string
}> & {
  showHealthBar: boolean
  deathSounds: ValidSounds[]
  onDamage: null | ((damage: number, world: World) => void)
  damage: (damage: number, world: World, from?: string, reason?: string) => void
  dead: () => boolean
  revive: () => void
}

export type HealthProps = {
  hp?: number,
  maxHp?: number,
  showHealthBar?: boolean
  deathSounds?: ValidSounds[]
  onDamage?: null | ((damage: number, world: World) => void)
}

export const Health = (
  { hp, maxHp, showHealthBar = true, deathSounds, onDamage }: HealthProps = {}
): Health => {

  const health: Health = {
    type: "health",
    data: {
      hp: hp ?? 100,
      maxHp: maxHp ?? hp ?? 100,
      died: undefined,
      diedFrom: undefined,
      diedReason: undefined
    },
    showHealthBar,
    deathSounds: deathSounds ?? [],
    onDamage: onDamage ?? null,
    damage: (damage: number, world: World, from?: string, reason?: string) => {
      health.data.hp = max(0, health.data.hp - damage)

      if (health.onDamage) health.onDamage(damage, world)

      if (health.data.hp <= 0 && health.data.died === undefined) {
        health.data.died = world.tick
        if (from) health.data.diedFrom = from
        if (reason) health.data.diedReason = reason
      }
    },
    dead: () => health.data.hp <= 0,
    revive: () => {
      health.data.hp = health.data.maxHp
      health.data.died = undefined
      health.data.diedFrom = undefined
      health.data.diedReason = undefined
    }
  }
  return health
}

export const HealthSystem = SystemBuilder({
  id: "HealthSystem",
  init: (world) => ({
    id: "HealthSystem",
    query: ["health"],
    priority: 5,
    onTick: (entities: Entity<Health>[]) => {
      for (const entity of entities) {
        const { health } = entity.components
        if (health.data.hp <= 0) {
          world.removeEntity(entity.id)

          if (world.client && health.deathSounds.length > 0) {
            // world.client?.soundManager.play(health.deathSounds, 0.1)
          }
        }
      }
    }
  })
})
