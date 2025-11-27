import { Component } from "@piggo-gg/core"

export type Debug = Component<"debug">

export const Debug = (): Debug => (
  { type: "debug" }
)
