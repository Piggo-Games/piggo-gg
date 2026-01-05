import {
  Collider, Debug, Entity, LineWall, Networked, PI, Position, Renderable,
  Shadow, asin, cos, loadTexture, min, pixiGraphics, sin, HoopsState
} from "@piggo-gg/core"
import {
  COURT_CENTER, COURT_CENTER_CIRCLE_RADIUS_X, COURT_CENTER_CIRCLE_RADIUS_Y, COURT_HEIGHT,
  COURT_LINE_WIDTH, COURT_LINE_Y_SCALE, COURT_SPLAY, COURT_WIDTH, FREE_THROW_CIRCLE_RADIUS,
  FREE_THROW_DISTANCE, FREE_THROW_LANE_WIDTH, HOOP_OFFSET_X, HOOP_RADIUS, HOOP_SCORE_Z,
  THREE_POINT_RADIUS, THREE_POINT_SIDE_Y
} from "./HoopsConstants"
import { Texture } from "pixi.js"

export const Ball = () => Entity({
  id: "ball",
  components: {
    debug: Debug(),
    position: Position({ x: COURT_CENTER.x, gravity: 0.1 }),
    collider: Collider({ shape: "ball", radius: 4, restitution: 0.6, group: "2" }),
    shadow: Shadow(2.5, 3),
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
    0, 0,
    1, 0,
  ],
  visible: true,
  fill: 0xc48a5a,
  strokeAlpha: 1
})

export const Centerline = () => LineWall({
  position: { x: 0, y: -COURT_HEIGHT / 2 },
  points: [
    COURT_WIDTH / 2, 0,
    COURT_WIDTH / 2, COURT_HEIGHT
  ],
  visible: true,
  strokeAlpha: 1,
  group: "none"
})

export const CenterCircle = () => Entity({
  id: "center-circle",
  components: {
    position: Position({ x: COURT_CENTER.x, y: 0 }),
    renderable: Renderable({
      zIndex: 3.1,
      setup: async (renderable) => {
        renderable.c = pixiGraphics()
          .ellipse(0, 0, COURT_CENTER_CIRCLE_RADIUS_X, COURT_CENTER_CIRCLE_RADIUS_Y)
          .stroke({ width: 1.5, color: 0xffffff, alpha: 1 })
      }
    })
  }
})

export const CourtLines = () => Entity({
  id: "court-lines",
  components: {
    position: Position(),
    renderable: Renderable({
      zIndex: 3.2,
      setup: async (renderable) => {
        const g = pixiGraphics()
        const halfCourtHeight = COURT_HEIGHT / 2
        const laneHalf = FREE_THROW_LANE_WIDTH / 2
        const freeThrowCircleRadiusY = FREE_THROW_CIRCLE_RADIUS * COURT_LINE_Y_SCALE
        const threePointRadiusY = THREE_POINT_RADIUS * COURT_LINE_Y_SCALE

        const leftHoopX = HOOP_OFFSET_X
        const rightHoopX = COURT_WIDTH - HOOP_OFFSET_X
        const leftFreeThrowX = leftHoopX + FREE_THROW_DISTANCE
        const rightFreeThrowX = rightHoopX - FREE_THROW_DISTANCE

        const threePointTheta = asin(min(1, THREE_POINT_SIDE_Y / threePointRadiusY))

        const edgeAtY = (y: number) => {
          const t = (y + halfCourtHeight) / COURT_HEIGHT
          return { left: -COURT_SPLAY * t, right: COURT_WIDTH + COURT_SPLAY * t }
        }

        const line = (x1: number, y1: number, x2: number, y2: number) => {
          g.moveTo(x1, y1)
          g.lineTo(x2, y2)
        }

        const arc = (cx: number, cy: number, rx: number, ry: number, start: number, end: number, steps = 36) => {
          const step = (end - start) / steps
          for (let i = 0; i <= steps; i += 1) {
            const angle = start + step * i
            const x = cx + cos(angle) * rx
            const y = cy + sin(angle) * ry
            if (i === 0) g.moveTo(x, y)
            else g.lineTo(x, y)
          }
        }

        const offset = 8

        // Free throw lane
        const laneTopEdges = edgeAtY(-laneHalf)
        const laneBottomEdges = edgeAtY(laneHalf)
        line(laneTopEdges.left, -laneHalf, leftFreeThrowX - offset, -laneHalf)
        line(laneBottomEdges.left, laneHalf, leftFreeThrowX - offset, laneHalf)
        line(rightFreeThrowX, -laneHalf, laneTopEdges.right, -laneHalf)
        line(rightFreeThrowX, laneHalf, laneBottomEdges.right, laneHalf)

        // free throw line
        line(leftFreeThrowX - offset, laneHalf, leftFreeThrowX, -laneHalf)
        line(rightFreeThrowX - offset, -laneHalf, rightFreeThrowX, laneHalf)

        // Free throw circles
        console.log({ freeThrowCircleRadiusY })
        arc(leftFreeThrowX - offset, 0, FREE_THROW_CIRCLE_RADIUS, freeThrowCircleRadiusY, -Math.PI / 2, Math.PI / 2)
        arc(rightFreeThrowX, 0, FREE_THROW_CIRCLE_RADIUS, freeThrowCircleRadiusY, Math.PI / 2, Math.PI * 1.5)

        // 3-point lines
        line(-6, -THREE_POINT_SIDE_Y, 101, -THREE_POINT_SIDE_Y)
        line(-45, THREE_POINT_SIDE_Y, 77, THREE_POINT_SIDE_Y)
        line(456, -THREE_POINT_SIDE_Y, 348, -THREE_POINT_SIDE_Y)
        line(495, THREE_POINT_SIDE_Y, 373, THREE_POINT_SIDE_Y)

        // 3-point arcs
        console.log({ threePointRadiusY, threePointTheta })
        arc(74, -2, 82, 72, -PI / 2 + 0.33, PI / 2)
        arc(376, -2, 82, 72, PI / 2, PI * 1.5 - 0.34)

        g.stroke({ width: COURT_LINE_WIDTH, color: 0xffffff, alpha: 1 })
        renderable.c = g
      }
    })
  }
})

export const Goal1 = () => Entity({
  id: "goal1",
  components: {
    debug: Debug(),
    position: Position({ x: -26, y: -12, z: 36 }),
    renderable: Renderable({
      zIndex: 4,
      anchor: { x: 0, y: 0.9 },
      setup: async (renderable) => {
        const board = pixiGraphics()
          .moveTo(-1, 0)
          .lineTo(-8, 26)
          .lineTo(-15, 12)
          .lineTo(-8, -14)
          .lineTo(-1, 0)
          .fill({ color: 0xf7f2e8, alpha: 1 })
          .stroke({ color: 0xFF7F50, width: 1, alpha: 1 })
        board.y = -10
        board.x = -1

        const hoop = pixiGraphics()
          .ellipse(0, 0, 6, 4)
          .stroke({ color: 0xFF7F50, width: 1.6, alpha: 1 })

        renderable.c.addChild(board, hoop)
      }
    })
  }
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
        state.dribbleLocked = false
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
