import {
  Collider, Debug, Entity, LineWall, Networked, Position, Renderable,
  Shadow, loadTexture, pixiGraphics
} from "@piggo-gg/core"
import { Texture } from "pixi.js"
import {
  COURT_CENTER, COURT_HEIGHT, COURT_SPLAY, COURT_WIDTH, HOOP_OFFSET_X, HOOP_RADIUS, HOOP_SCORE_Z
} from "./HoopsConstants"
import type { HoopsState } from "./Hoops"

export const Ball = () => Entity({
  id: "ball",
  components: {
    debug: Debug(),
    position: Position({ x: COURT_CENTER.x, y: COURT_CENTER.y, gravity: 0.1 }),
    collider: Collider({ shape: "ball", radius: 4, restitution: 0.6, group: "2" }),
    shadow: Shadow(3, 3),
    networked: Networked(),
    renderable: Renderable({
      zIndex: 4,
      anchor: { x: 0.5, y: 0.5 },
      interpolate: true,
      scaleMode: "nearest",
      rotates: true,
      setup: async (r) => {
        r.setBevel({ lightAlpha: 0.5 })

        const texture = (await loadTexture("bball.json"))["0"] as Texture
        texture.source.scaleMode = "nearest"

        r.c = pixiGraphics().circle(0, 0, 5.5).fill({ texture })
      }
    })
  }
})

export const Court = () => LineWall({
  position: { x: 0, y: -COURT_HEIGHT / 2 },
  points: [
    0, 0,
    COURT_WIDTH, 0,
    COURT_WIDTH + COURT_SPLAY, COURT_HEIGHT,
    -COURT_SPLAY, COURT_HEIGHT,
    0, 0
  ],
  visible: true,
  fill: 0xc48a5a,
  strokeAlpha: 0.8
})

export const Centerline = () => LineWall({
  position: { x: 0, y: -COURT_HEIGHT / 2 },
  points: [
    COURT_WIDTH / 2, 0,
    COURT_WIDTH / 2, COURT_HEIGHT
  ],
  visible: true,
  strokeAlpha: 0.5,
  group: "none"
})

type HoopProps = {
  id: string
  x: number
  y: number
  facing: "left" | "right"
  scoringTeam: 1 | 2
}

export const Hoop = ({ id, x, y, facing, scoringTeam }: HoopProps) => Entity({
  id,
  components: {
    position: Position({ x, y }),
    networked: Networked(),
    collider: Collider({
      shape: "ball",
      radius: HOOP_RADIUS,
      isStatic: true,
      sensor: (e2, world) => {
        if (e2.id !== "ball") return false

        const state = world.game.state as HoopsState
        if (state.phase !== "play") return false
        if (state.ballOwner) return false

        const ball = world.entity<Position>("ball")
        const ballPos = ball?.components.position
        if (!ballPos) return false

        if (ballPos.data.z > HOOP_SCORE_Z) return false
        if (ballPos.data.velocity.z > 0) return false

        if (scoringTeam === 1) {
          state.scoreLeft += 1
        } else {
          state.scoreRight += 1
        }

        state.phase = "score"
        state.scoredTeam = scoringTeam
        state.scoredTick = world.tick
        state.ballOwner = ""
        state.ballOwnerTeam = 0
        return true
      }
    }),
    renderable: Renderable({
      zIndex: 3.6,
      setup: async (renderable) => {
        renderable.c.rotation = facing === "right" ? -Math.PI / 2 : Math.PI / 2

        const ring = pixiGraphics()
          .circle(0, 0, HOOP_RADIUS)
          .stroke({ color: 0xff8c1a, width: 3, alpha: 0.9 })

        const board = pixiGraphics()
          .roundRect(-12, -16, 24, 10, 2)
          .fill({ color: 0xf7f2e8, alpha: 0.95 })
          .stroke({ color: 0x1e1e1e, width: 2, alpha: 0.8 })

        renderable.c.addChild(board)
        renderable.c.addChild(ring)
      }
    })
  }
})

export const HoopSet = () => [
  Hoop({ id: "hoop-left", x: HOOP_OFFSET_X, y: 0, facing: "right", scoringTeam: 2 }),
  Hoop({ id: "hoop-right", x: COURT_WIDTH - HOOP_OFFSET_X, y: 0, facing: "left", scoringTeam: 1 })
]
