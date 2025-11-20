import { random } from "@piggo-gg/core"

export const { stringify } = JSON

export const randomHash = (length: number = 7) => {
  const id = random().toString(36).substring(length)
  return id
}

export const randomPlayerId = () => {
  return `player-${randomHash(5)}`
}

export const arrHash = (arr: Int8Array): number => {
  let h = 0x811c9dc5
  for (let i = 0; i < arr.length; i++) {
    h ^= arr[i]
    h = (h * 0x01000193) >>> 0
  }
  return h
}
