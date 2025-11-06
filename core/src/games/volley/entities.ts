import {
  Collider, Debug, Entity, LineWall, loadTexture, Networked, NPC,
  pixiGraphics, Position, Renderable, Shadow, sign, sqrt, XYZdiff
} from "@piggo-gg/core"
import { Texture } from "pixi.js"
import { range, VolleyState } from "./Volley"

export const Ball = () => Entity({
  id: "ball",
  components: {
    debug: Debug(),
    position: Position({ x: 225, y: 0, gravity: 0.05 }),
    collider: Collider({ shape: "ball", radius: 4, restitution: 0.8 }),
    shadow: Shadow(3, 3),
    networked: Networked(),
    npc: NPC({
      behavior: (ball: Entity<Position | NPC | Collider>) => {
        const { position, collider } = ball.components

        const { x, y } = position.data.velocity
        position.data.rotation += 0.001 * sqrt((x * x + y * y)) * sign(x)

        if (position.data.z < 22) {
          collider.setGroup("2")
        } else {
          collider.setGroup("3")
        }
      }
    }),
    renderable: Renderable({
      zIndex: 4,
      anchor: { x: 0.5, y: 0.5 },
      interpolate: true,
      scaleMode: "nearest",
      rotates: true,
      onTick: ({ entity: ball, world }) => {
        const { position: ballPos } = ball.components
        const { position, actions } = world.client?.character()?.components ?? {}
        if (!position || !actions) return

        const far = XYZdiff(position.data, ballPos.data, range)

        if (!far) {
          ball.components.renderable.setOutline({ color: 0x55ff00, thickness: 2 })
        } else {
          ball.components.renderable.setOutline({ color: 0x000000, thickness: 0 })
        }
      },
      setup: async (r) => {
        r.setBevel({ lightAlpha: 0.5 })

        const texture = (await loadTexture("vball.json"))["0"] as Texture
        texture.source.scaleMode = "nearest"

        r.c = pixiGraphics().circle(0, 0, 5.5).fill({ texture })
      }
    })
  }
})

// todo need a wider hitbox for the players
export const Centerline = () => Entity({
  id: "centerline",
  components: {
    position: Position({ x: 225 }),
    collider: Collider({ shape: "cuboid", length: 12, width: 75, isStatic: true })
  }
})

export const Court = () => LineWall({
  position: { x: 0, y: -75 },
  points: [
    0, 0,
    450, 0,
    500, 150,
    -50, 150,
    0, 0,
    5, 0
  ],
  visible: true,
  fill: 0x0066aa,
  strokeAlpha: 0.95
})

export const Bounds = (group: "2" | "3") => LineWall({
  id: `bounds-${group}`,
  position: { x: 225, y: -84 },
  group,
  points: [
    0, 0,
    -234, 0,
    -289, 168,
    289, 168,
    234, 0,
    0, 0
  ],
  sensor: (e2, world) => {
    if (e2.id !== "ball") return false
    if (e2.components.position.data.z === 0) return false

    const state = world.game.state as VolleyState
    state.phase = "point"
    state.lastWin = state.lastHitTeam === 1 ? 2 : 1

    return true
  }
})

export const PostTop = () => Entity({
  id: "post-top",
  components: {
    position: Position({ x: 225, y: -76, z: 25 }),
    renderable: Renderable({
      zIndex: 3.2,
      setup: async (renderable) => {
        renderable.setBevel()
        renderable.c = pixiGraphics().roundRect(-3, 0, 6, 28, 2).fill({ color: 0x943126, alpha: 1 })
      }
    })
  }
})

export const PostBottom = () => Entity({
  id: "post-bottom",
  components: {
    position: Position({ x: 225, y: 74, z: 25 }),
    renderable: Renderable({
      zIndex: 3.9,
      setup: async (renderable) => {
        renderable.setBevel()
        renderable.c = pixiGraphics().roundRect(-3, 0, 6, 28, 2).fill({ color: 0x943126, alpha: 1 })
      }
    })
  }
})

export const Net = () => Entity({
  id: "net",
  components: {
    position: Position({ x: 225, z: 25 }),
    collider: Collider({ shape: "line", points: [0, -75, 0, 75], isStatic: true, group: "2" }),
    renderable: Renderable({
      zIndex: 3.8,
      setup: async (renderable) => {
        renderable.setBevel()
        renderable.c = pixiGraphics().roundRect(-1, -75, 2, 150, 1).fill({ color: 0xffe47a, alpha: 1 })
      }
    })
  }
})
