import { Entity, Networked, Position } from "@piggo-gg/core"

export const SurfPilot = () => Entity<Position>({
  id: "surf-pilot",
  components: {
    networked: Networked(),
    position: Position({ x: 3.5, y: 6, z: 2.5, flying: true, speed: 8 })
  }
})
