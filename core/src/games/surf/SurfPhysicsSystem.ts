import { Position, SystemBuilder, cos, hypot, round, sin } from "@piggo-gg/core"

// Simple free-fly physics for Surf: moves the flying entity with WASD + space/shift.
export const SurfPhysicsSystem = SystemBuilder({
  id: "SurfPhysicsSystem",
  init: (world) => {
    if (world.mode === "server") return undefined

    const speed = 8 // units per second
    const smoothing = 0.18
    const dampening = 0.86

    return {
      id: "SurfPhysicsSystem",
      query: ["position"],
      priority: 7,
      skipOnRollback: true,
      onTick: (entities) => {
        const client = world.client
        if (!client) return

        const flyer = entities.find(({ components }) => components.position.data.flying)
        if (!flyer) return

        const { position } = flyer.components

        const yaw = client.controls.localAim.x
        const pitch = client.controls.localAim.y

        const forward = {
          x: -sin(yaw) * cos(pitch),
          y: -cos(yaw) * cos(pitch),
          z: sin(pitch)
        }
        const right = {
          x: cos(yaw),
          y: -sin(yaw),
          z: 0
        }

        const dir = { x: 0, y: 0, z: 0 }
        const add = (v: typeof dir, scale = 1) => {
          dir.x += v.x * scale
          dir.y += v.y * scale
          dir.z += v.z * scale
        }

        const { bufferDown } = client
        if (bufferDown.get("w")) add(forward)
        if (bufferDown.get("s")) add(forward, -1)
        if (bufferDown.get("d")) add(right)
        if (bufferDown.get("a")) add(right, -1)
        if (bufferDown.get(" ")) dir.z += 1
        if (bufferDown.get("shift")) dir.z -= 1

        const length = hypot(dir.x, dir.y, dir.z)
        const hasInput = length > 0.001

        const dt = 1 / world.tickrate

        const target = hasInput ? {
          x: (dir.x / length) * speed,
          y: (dir.y / length) * speed,
          z: (dir.z / length) * speed
        } : { x: 0, y: 0, z: 0 }

        // soften input and add gentle damping
        position.data.velocity.x = round(position.data.velocity.x * dampening + target.x * smoothing, 4)
        position.data.velocity.y = round(position.data.velocity.y * dampening + target.y * smoothing, 4)
        position.data.velocity.z = round(position.data.velocity.z * dampening + target.z * smoothing, 4)

        position.localVelocity = { ...position.data.velocity }

        position.data.x = round(position.data.x + position.data.velocity.x * dt, 5)
        position.data.y = round(position.data.y + position.data.velocity.y * dt, 5)
        position.data.z = round(position.data.z + position.data.velocity.z * dt, 5)
      }
    }
  }
})
