import { XY } from "@piggo-gg/core"

export type KeyMouse = {
  key: string
  mouse: XY
  aim: XY
  tick: number
  hold: number
  delta: number
  target?: string
}

export type KeyBuffer = {
  all: () => KeyMouse[]
  get: (key: string) => KeyMouse | undefined
  copy: () => KeyBuffer
  clear: () => void
  push: (km: KeyMouse) => void
  remove: (key: string) => void
  updateHold: (tick: number) => void
}

export const KeyBuffer = (b?: KeyMouse[]): KeyBuffer => {
  let buffer: KeyMouse[] = b ? [...b] : []

  return {
    all: () => [...buffer],
    get: (key: string) => {
      return buffer.find((b) => b.key === key)
    },
    copy: () => KeyBuffer(buffer),
    clear: () => {
      buffer = []
    },
    push: (km: KeyMouse) => {
      if (!buffer.find((b) => b.key === km.key)) return buffer.push(km)
    },
    remove: (key: string) => {
      buffer = buffer.filter((b) => b.key !== key)
    },
    updateHold: (tick: number) => {
      for (const b of buffer) {
        b.hold = tick - b.tick - 1
      }
    }
  }
}
