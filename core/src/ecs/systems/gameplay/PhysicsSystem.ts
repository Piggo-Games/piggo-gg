import {
  Collider, Entity, Position, SystemBuilder, XYdistance, abs, keys, logPerf, max, round, sign
} from "@piggo-gg/core"
import { RigidBody, World as RapierWorld, init as RapierInit } from "@dimforge/rapier2d-compat"

export const PhysicsSystem = (mode: "global" | "local") => SystemBuilder({
  id: mode === "global" ? "PhysicsSystem" : "LocalPhysicsSystem",
  init: (world) => {

    // todo world.physics
    let physics: undefined | RapierWorld = undefined

    if (mode === "local" && world.mode === "server") return undefined

    let bodies: Record<string, RigidBody> = {}
    let colliders: Map<Entity<Collider | Position>, Collider> = new Map()

    // set up physics
    RapierInit().then(() => physics = new RapierWorld({ x: 0, y: 0 }))

    const resetPhysics = () => {
      if (physics === undefined) return

      for (const id of keys(bodies)) delete bodies[id]
      colliders.clear()

      physics?.free()

      physics = new RapierWorld({ x: 0, y: 0 })
      physics.timestep = 0.00625 // 25 / 1000 / 4
    }

    return {
      id: mode === "global" ? "PhysicsSystem" : "LocalPhysicsSystem",
      query: ["position", "collider"],
      priority: mode === "global" ? 7 : 9,
      onRollback: resetPhysics,
      onTick: (entities: Entity<Collider | Position>[], isRollback: false) => {

        // wait until rapier is ready
        if (!physics) return

        // reset physics if not rollback
        if (!isRollback && mode === "global") resetPhysics()

        // remove old bodies (TODO does this matter)
        for (const id of keys(bodies)) {
          if (!world.entities[id]) {
            physics.removeRigidBody(bodies[id])
            delete bodies[id]
          }
        }

        const t1 = performance.now()
        if (mode === "global") {

          const groups: Set<string> = new Set()

          // find dynamic body groups
          for (const entity of entities) {
            const { collider } = entity.components
            if (collider.isStatic === false) {
              groups.add(collider.group)
            }
          }

          // cull static colliders
          entities = entities.filter((entity) => {
            const { collider, renderable } = entity.components

            // if (renderable?.visible === false) return false
            return (collider.isStatic === false || !collider.cullable || groups.has(collider.group))
          })

          // sort entities by id
          entities.sort((a, b) => a.id > b.id ? 1 : -1)

          // prepare physics bodies for each entity
          for (const entity of entities) {
            const { position, collider } = entity.components

            // handle new physics bodies
            if (!bodies[entity.id]) {

              // create rapier body/collider
              const body = physics.createRigidBody(collider.bodyDesc)
              try {
                collider.rapierCollider = physics.createCollider(collider.colliderDesc, body)
              } catch (e) {
                console.log("Error creating collider", e)
              }

              // set Collider.body
              collider.body = body

              // store body
              bodies[entity.id] = body

              // store collider
              colliders.set(entity, collider)
            }

            // update body position
            bodies[entity.id].setTranslation({ x: position.data.x, y: position.data.y }, true)
          }
        }
        logPerf("prepare physics", t1)

        const t2 = performance.now()
        // update body velocities
        for (const entity of entities) {
          const { collider, position } = entity.components

          if (collider.isStatic) continue
          if (!collider.body) continue

          collider.body.setLinvel(position.data.velocity, true)
        }
        logPerf("update velocities", t2)

        const t3 = performance.now()

        // run physics
        physics.step()
        physics.step()
        physics.step()
        physics.step()
        logPerf("step physics", t3)

        const t4 = performance.now()

        // update entity positions
        for (const entity of entities) {
          const { collider, position } = entity.components

          if (collider.isStatic) continue
          if (!collider.body) continue

          const translation = collider.body.translation()
          const linvel = collider.body.linvel()

          // check if the entity has collided
          const diffX = position.data.velocity.x - round(linvel.x, 3)
          const diffY = position.data.velocity.y - round(linvel.y, 3)
          if (position.data.velocityResets && (abs(diffX) > 1 || abs(diffY) > 1)) {
            if (sign(linvel.y) !== sign(position.data.velocity.y) && sign(linvel.x) !== sign(position.data.velocity.x)) {
              position.lastCollided = world.tick
              // continue
            }
          }

          // update position/velocity
          if (mode === "global") {
            position.data.x = round(translation.x, 3)
            position.data.y = round(translation.y, 3)
            position.data.velocity.x = round(linvel.x, 3)
            position.data.velocity.y = round(linvel.y, 3)

            position.data.z = max(0, position.data.z + position.data.velocity.z)

            if (position.data.z + position.data.velocity.z <= 0) {
              position.data.standing = true
            } else {
              position.data.standing = false
              position.data.velocity.z -= position.data.gravity
            }
          } else {
            position.localVelocity.x = round(linvel.x, 3)
            position.localVelocity.y = round(linvel.y, 3)

            if (position.data.standing) {
              position.localVelocity.z = 0
            } else {
              position.localVelocity.z = position.data.velocity.z
            }
          }
        }
        logPerf("update positions", t4)

        if (mode === "local") return

        const t5 = performance.now()

        // sensor callbacks
        for (const [entity, collider] of colliders.entries()) {
          if (collider.sensor && collider.rapierCollider) {

            const collidedWith: Entity<Collider | Position>[] = []

            physics.intersectionPairsWith(collider.rapierCollider, (collider2) => {
              const collided = [...colliders.entries()].find(([_, c]) => c.rapierCollider === collider2)
              if (collided && world.entities[collided[0].id]) collidedWith.push(world.entity<Collider | Position>(collided[0].id)!)
            })

            // collide only once
            let collided = false

            collidedWith.sort((a, b) => {
              const aDistance = XYdistance(a.components.position.data, entity.components.position.data)
              const bDistance = XYdistance(b.components.position.data, entity.components.position.data)
              return aDistance > bDistance ? 1 : -1
            }).forEach((entity) => {
              if (!collided) collided = collider.sensor(entity, world)
            })
          }
        }
        logPerf("sensor callbacks", t5)

        // clear heading if arrived
        entities.forEach((entity) => {
          const { position } = entity.components
          if (position.data.heading.x || position.data.heading.y) {
            const dx = position.data.heading.x - position.data.x
            const dy = position.data.heading.y - position.data.y
            if (abs(dx) < 5 && abs(dy) < 5) {
              position.data.heading = { x: NaN, y: NaN }
            }
          }
        })

        // update velocities (headings)
        entities.forEach((entity) => {
          entity.components.position.updateVelocity()
        })
      }
    }
  }
})
