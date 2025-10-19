import { Component } from "@piggo-gg/core"

export type PC = Component<"pc"> & {
  data: {
    leader: boolean
    name: string
    points: number
    ready: boolean
  }
}

export const PC = ({ name, leader }: { name: string, leader?: boolean }): PC => ({
  type: "pc",
  data: {
    leader: leader ?? false,
    name,
    points: 0,
    ready: false
  }
})
