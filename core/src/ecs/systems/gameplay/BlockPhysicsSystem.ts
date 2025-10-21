import {
  abs, Collider, Entity, floor, max, Position, round, sign, SystemBuilder
} from "@piggo-gg/core"

export const BlockPhysicsSystem = (mode: "global" | "local") => SystemBuilder({
  id: mode === "global" ? "BlockPhysicsSystem" : "LocalBlockPhysicsSystem",
  init: (world) => {

    if (mode === "local" && world.mode === "server") return undefined

    const blockSize = 0.3
    const radius = 0.05

    return {
      id: mode === "global" ? "BlockPhysicsSystem" : "LocalBlockPhysicsSystem",
      query: ["position", "collider"],
      priority: mode === "global" ? 7 : 9,
      onTick: (entities: Entity<Position | Collider>[]) => {

        for (const entity of entities) {
          const { position, collider } = entity.components

          if (collider.isStatic) continue

          let xSwept = false
          let ySwept = false
          let zSwept = false

          const { velocity, x, y, z } = position.data

          position.localVelocity = { ...position.data.velocity }

          // ySweep

          let wouldGo = {
            x: x,
            y: y + velocity.y / 40 + 0.05 * sign(velocity.y),
            z: z
          }

          let ijk = {
            x: floor((0.15 + wouldGo.x) / 0.3),
            y: floor((0.15 + wouldGo.y) / 0.3),
            z: floor((0.01 + wouldGo.z) / 0.3)
          }

          const ySweep = world.blocks.atIJK(ijk)

          if (ySweep) {
            ySwept = true

            const blockMin = {
              x: ijk.x * blockSize - 0.15,
              y: ijk.y * blockSize - 0.15,
              z: ijk.z * blockSize
            }

            const blockMax = {
              x: blockMin.x + blockSize,
              y: blockMin.y + blockSize,
              z: blockMin.z + blockSize
            }

            if (velocity.y > 0 && wouldGo.y > blockMin.y) {
              if (mode === "local") {
                position.localVelocity.y = 40 * (round(blockMin.y - radius, 5) - position.data.y)
              } else {
                position.data.y = round(blockMin.y - radius, 5)
                position.data.velocity.y = 0
              }
            } else if (velocity.y < 0 && wouldGo.y < blockMax.y) {
              if (mode === "local") {
                position.localVelocity.y = 40 * (round(blockMax.y + radius, 5) - position.data.y)
              } else {
                position.data.y = round(blockMax.y + radius, 5)
                position.data.velocity.y = 0
              }
            }
          }

          // xSweep

          wouldGo = {
            x: x + velocity.x / 40 + 0.05 * sign(velocity.x),
            y: y,
            z: z
          }

          ijk = {
            x: floor((0.15 + wouldGo.x) / 0.3),
            y: floor((0.15 + wouldGo.y) / 0.3),
            z: floor((0.01 + wouldGo.z) / 0.3)
          }

          const xSweep = world.blocks.atIJK(ijk)

          if (xSweep) {
            xSwept = true

            const blockMin = {
              x: ijk.x * blockSize - 0.15,
              y: ijk.y * blockSize - 0.15,
              z: ijk.z * blockSize
            }

            const blockMax = {
              x: blockMin.x + blockSize,
              y: blockMin.y + blockSize,
              z: blockMin.z + blockSize,
            }

            if (velocity.x > 0) {
              if (mode === "local") {
                position.localVelocity.x = 40 * (round(blockMin.x - radius, 5) - position.data.x)
              } else {
                position.data.x = round(blockMin.x - radius, 5)
                position.data.velocity.x = 0
              }
            } else if (velocity.x < 0) {
              if (mode === "local") {
                position.localVelocity.x = 40 * (round(blockMax.x + radius, 5) - position.data.x)
              } else {
                position.data.x = round(blockMax.x + radius, 5)
                position.data.velocity.x = 0
              }
            }
          }

          // cornerSweep

          if (!ySweep && !xSweep) {
            wouldGo = {
              x: x + velocity.x / 40 + 0.05 * sign(velocity.x),
              y: y + velocity.y / 40 + 0.05 * sign(velocity.y),
              z: z
            }

            ijk = {
              x: floor((0.15 + wouldGo.x) / 0.3),
              y: floor((0.15 + wouldGo.y) / 0.3),
              z: floor((0.01 + wouldGo.z) / 0.3)
            }

            const cornerSweep = world.blocks.atIJK(ijk)

            if (cornerSweep) {
              // if (mode === "global") console.log("cornerSweep", world.tick)
              const blockMin = {
                x: ijk.x * blockSize - 0.15,
                y: ijk.y * blockSize - 0.15,
                z: ijk.z * blockSize
              }

              const blockMax = {
                x: blockMin.x + blockSize,
                y: blockMin.y + blockSize,
                z: blockMin.z + blockSize,
              }

              if (velocity.x > 0 && velocity.y > 0) {
                const distX = abs(blockMin.x - wouldGo.x)
                const distY = abs(blockMin.y - wouldGo.y)

                if (distY > distX) {
                  if (mode === "local") {
                    // position.localVelocity.x = 0
                  } else {
                    position.data.x = round(blockMin.x - radius, 5)
                    position.data.velocity.x = 0
                  }
                } else {
                  if (mode === "local") {
                    // position.localVelocity.y = 0
                  }
                  else {
                    position.data.y = round(blockMin.y - radius, 5)
                    position.data.velocity.y = 0
                  }
                }
              } else if (velocity.x < 0 && velocity.y > 0) {
                const distX = abs(blockMax.x - wouldGo.x)
                const distY = abs(blockMin.y - wouldGo.y)

                if (distY > distX) {
                  if (mode === "local") {
                    // position.localVelocity.x = 0
                  } else {
                    position.data.x = round(blockMax.x + radius, 5)
                    position.data.velocity.x = 0
                  }
                } else {
                  if (mode === "local") {
                    // position.localVelocity.y = 0
                  } else {
                    position.data.y = round(blockMin.y - radius, 5)
                    position.data.velocity.y = 0
                  }
                }
              } else if (velocity.x > 0 && velocity.y < 0) {
                const distX = abs(blockMin.x - wouldGo.x)
                const distY = abs(blockMax.y - wouldGo.y)

                if (distY > distX) {
                  if (mode === "local") {
                    // position.localVelocity.x = 0
                  } else {
                    position.data.x = round(blockMin.x - radius, 5)
                    position.data.velocity.x = 0
                  }
                } else {
                  if (mode === "local") {
                    // position.localVelocity.y = 0
                  } else {
                    position.data.y = round(blockMax.y + radius, 5)
                    position.data.velocity.y = 0
                  }
                }
              } else if (velocity.x < 0 && velocity.y < 0) {
                const distX = abs(blockMax.x - wouldGo.x)
                const distY = abs(blockMax.y - wouldGo.y)

                if (distY > distX) {
                  if (mode === "local") {
                  } else {
                    position.data.x = round(blockMax.x + radius, 5)
                    position.data.velocity.x = 0
                  }
                } else {
                  if (mode === "local") {
                  } else {
                    position.data.y = round(blockMax.y + radius, 5)
                    position.data.velocity.y = 0
                  }
                }
              }
            }
          }

          // zSweep

          wouldGo = {
            x, y,
            z: z + velocity.z + 0.1 * sign(velocity.z)
          }

          ijk = {
            x: floor((0.15 + wouldGo.x) / 0.3),
            y: floor((0.15 + wouldGo.y) / 0.3),
            z: floor((0.01 + wouldGo.z) / 0.3)
          }

          let applyZ = false

          const zSweep = world.blocks.atIJK(ijk)

          if (zSweep) {
            zSwept = true

            const blockMin = {
              x: ijk.x * blockSize - 0.15,
              y: ijk.y * blockSize - 0.15,
              z: ijk.z * blockSize
            }

            const blockMax = {
              x: blockMin.x + blockSize,
              y: blockMin.y + blockSize,
              z: blockMin.z + blockSize
            }

            if (velocity.z > 0 && wouldGo.z > blockMin.z) {
              if (mode === "local") {
                position.localVelocity.z = round(blockMin.z - 0.1 - position.data.z, 5)
              } else {
                position.data.z = round(blockMin.z - 0.1, 5)
                position.data.velocity.z = 0
                position.data.standing = false
              }
            } else if (velocity.z < 0 && wouldGo.z + 0.1 < blockMax.z) {
              if (mode === "local") {
                position.localVelocity.z = round(blockMax.z - position.data.z, 5)
              } else {
                position.data.z = round(blockMax.z, 5)
                position.data.velocity.z = 0
                position.data.standing = true
              }
            } else if (mode !== "local") {
              position.data.standing = false
              applyZ = true
            }
          } else if (mode !== "local") {
            position.data.standing = false
            applyZ = true
          }

          // enhanced zSweep

          if (!xSwept && !ySwept && !zSwept) {

            wouldGo = {
              x: x + velocity.x / 40 + 0.05 * sign(velocity.x),
              y: y + velocity.y / 40 + 0.05 * sign(velocity.y),
              z: z + velocity.z + 0.1 * sign(velocity.z)
            }

            ijk = {
              x: floor((0.15 + wouldGo.x) / 0.3),
              y: floor((0.15 + wouldGo.y) / 0.3),
              z: floor((0.01 + wouldGo.z) / 0.3)
            }

            const zSweepExtra = world.blocks.atIJK(ijk)

            if (zSweepExtra) {

              const blockMin = {
                x: ijk.x * blockSize - 0.15,
                y: ijk.y * blockSize - 0.15,
                z: ijk.z * blockSize
              }

              const blockMax = {
                x: blockMin.x + blockSize,
                y: blockMin.y + blockSize,
                z: blockMin.z + blockSize
              }

              if (velocity.z < 0 && wouldGo.z + 0.1 < blockMax.z) {
                if (mode === "local") {
                  position.localVelocity.z = round(blockMax.z - position.data.z, 5)
                } else {
                  position.data.z = round(blockMax.z, 5)
                  position.data.velocity.z = 0
                  position.data.standing = true
                }
              }
            }
          }

          const { tether } = position.data

          if (tether) {
            const dx = position.data.x - tether.x
            const dy = position.data.y - tether.y
            const dz = position.data.z - tether.z

            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)

            if (dist < 0.7 || dist > 10) {
              position.data.tether = undefined
            } else {
              if (mode === "local") {
                position.localVelocity.x -= dx / 200
                position.localVelocity.y -= dy / 200
                position.localVelocity.z -= dz / 400
              }

              // move player toward tether
              position.data.velocity.x -= dx / 200
              position.data.velocity.y -= dy / 200
              position.data.velocity.z -= dz / 400
            }
          }

          if (mode === "local") continue

          if (applyZ) position.data.z += position.data.velocity.z

          if (position.data.flying) {
            position.data.velocity.z = (position.data.aim.y + 0.2) * 0.07
          } else {
            position.data.velocity.z -= position.data.gravity
            position.data.velocity.z = max(position.data.velocity.z, -0.2)
          }

          // x/y movement
          position.data.x += position.data.velocity.x / 40
          position.data.y += position.data.velocity.y / 40

          // friction
          if (position.data.friction && !tether) {
            const { flying, standing } = position.data

            const scale = flying ? 0.98 : (standing ? 0.82 : 0.94)
            entity.components.position.scaleVelocity(scale)
          }
        }
      }
    }
  }
})
