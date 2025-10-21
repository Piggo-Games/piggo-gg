import { Component, World } from "@piggo-gg/core"

export type GunNames = "deagle" | "ak" | "awp"

export type GunProps = {
  automatic: boolean
  bulletSize: number
  clipSize: number
  damage: number
  fireRate: number
  name: GunNames
  reloadTime: number
  speed: number
}

// TODO some properties don't need to be networked
export type Gun = Component<"gun", GunProps & {
  clip: number
  lastShot: number
  reloading: undefined | number
  outlineColor: number
}> & {
  ammo: number
  canShoot: (world: World, tick: number, hold: number) => boolean
  didShoot: (world: World) => void
}

export const Gun = (props: GunProps): Gun => {
  const gun: Gun = {
    type: "gun",
    ammo: props.clipSize,
    data: {
      clip: props.clipSize,
      automatic: props.automatic,
      bulletSize: props.bulletSize ?? 0,
      clipSize: props.clipSize,
      damage: props.damage,
      fireRate: props.fireRate,
      lastShot: 0,
      outlineColor: 0x000000,
      name: props.name,
      reloading: undefined,
      reloadTime: props.reloadTime,
      speed: props.speed ?? 1
    },
    canShoot: (world: World, tick: number, hold: number) => {

      const { lastShot, fireRate, clip, reloading } = gun.data

      if (hold) {
        // only hold automatic
        if (!props.automatic) return false

        // firing rate
        if ((lastShot + fireRate) > world.tick) return false
      }

      // auto/semi
      if (!props.automatic && lastShot >= tick) return false

      // has clip
      if (clip <= 0) return false

      // if it's reloading
      if (reloading) return false

      return true
    },
    didShoot: (world: World) => {
      gun.data.lastShot = world.tick
      gun.data.clip -= 1
    }
  }

  return gun
}

export const GunBuilder = (props: GunProps) => () => Gun(props)
