import {
  Component, Entity, max, SystemBuilder, ValidSounds, World
} from "@piggo-gg/core"

export type KDA = { k: number, d: number, a: number }
export type KDAstring = `${number}|${number}|${number}`

export type Health = Component<"health", {
  hp: number,
  maxHp: number,
  died: null | number,
  diedFrom: null | string
  diedReason: null | string
  kda: KDAstring
}> & {
  showHealthBar: boolean
  deathSounds: ValidSounds[]
  onDamage: null | ((damage: number, world: World) => void)
  damage: (damage: number, world: World, from?: string, reason?: string) => void
  dead: () => boolean
  revive: () => void
  getKDA: () => KDA
  setKDA: (kda: KDA) => void
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
      died: null,
      diedFrom: null,
      diedReason: null,
      kda: "0|0|0"
    },
    showHealthBar,
    deathSounds: deathSounds ?? [],
    onDamage: onDamage ?? null,
    damage: (damage: number, world: World, from?: string, reason?: string) => {
      health.data.hp = max(0, health.data.hp - damage)

      if (health.onDamage) health.onDamage(damage, world)

      if (health.data.hp <= 0 && health.data.died === null) {
        health.data.died = world.tick
        if (from) health.data.diedFrom = from
        if (reason) health.data.diedReason = reason
      }
    },
    dead: () => health.data.hp <= 0,
    revive: () => {
      health.data.hp = health.data.maxHp
      health.data.died = null
      health.data.diedFrom = null
      health.data.diedReason = null
    },
    getKDA: () => {
      const [k, d, a] = health.data.kda.split("|").map(Number)
      return { k, d, a }
    },
    setKDA: (kda: KDA) => {
      health.data.kda = `${kda.k}|${kda.d}|${kda.a}`
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
