import {
  Collider, Debug, Entity, LineWall, Networked, Position, Renderable,
  Shadow, hypot, loadTexture, max, min, pixiGraphics
} from "@piggo-gg/core"
import { Graphics, Texture } from "pixi.js"
import {
  COURT_CENTER, COURT_CENTER_CIRCLE_RADIUS_X, COURT_CENTER_CIRCLE_RADIUS_Y, COURT_HEIGHT, COURT_SPLAY,
  COURT_WIDTH, HOOP_OFFSET_X, HOOP_RADIUS, HOOP_SCORE_Z, SHOT_CHARGE_TICKS, SHOT_GRAVITY,
  SHOT_SPEED_MAX, SHOT_SPEED_MIN, SHOT_UP_MAX, SHOT_UP_MIN
} from "./HoopsConstants"
import type { HoopsState } from "./Hoops"

export const Ball = () => Entity({
  id: "ball",
  components: {
    debug: Debug(),
    position: Position({ x: COURT_CENTER.x, y: COURT_CENTER.y, gravity: 0.1 }),
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
    0, 0
  ],
  visible: true,
  fill: 0xc48a5a,
  strokeAlpha: 0.9
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
          .stroke({ width: 2, color: 0xffffff, alpha: 1 })
      }
    })
  }
})

export const ShotChargeLine = () => Entity({
  id: "shot-charge-line",
  components: {
    position: Position(),
    renderable: Renderable({
      zIndex: 3.5,
      setContainer: async () => pixiGraphics(),
      onTick: (() => {
        const pointNodes: Graphics[] = []
        const pointColor = 0xfff1c1
        const pointAlpha = 0.85
        return ({ container, entity, world, renderable }) => {
          const g = container as Graphics
          const client = world.client
          const linePos = entity.components.position

          if (!client) {
            renderable.visible = false
            g.clear()
            return
          }

          const character = client.character()
          const position = character?.components.position
          if (!character || !position) {
            renderable.visible = false
            g.clear()
            if (linePos.data.follows) linePos.data.follows = null
            return
          }

          const state = world.game.state as HoopsState
          const hold = client.bufferDown.get("mb1")?.hold ?? 0

          if (hold <= 0 || state.phase !== "play" || state.ballOwner !== character.id) {
            renderable.visible = false
            g.clear()
            return
          }

          const { pointingDelta } = position.data
          if (!Number.isFinite(pointingDelta.x) || !Number.isFinite(pointingDelta.y)) {
            renderable.visible = false
            g.clear()
            return
          }

          const magnitude = hypot(pointingDelta.x, pointingDelta.y)
          if (!magnitude) {
            renderable.visible = false
            g.clear()
            return
          }

          const ball = world.entity<Position>("ball")
          const ballPos = ball?.components.position
          if (!ballPos) {
            renderable.visible = false
            g.clear()
            return
          }

          const originZ = max(1.5, ballPos.data.z)
          linePos.data.follows = null
          linePos.data.offset = { x: 0, y: 0 }
          linePos.setPosition({ x: ballPos.data.x, y: ballPos.data.y, z: originZ })

          const charge = min(1, hold / SHOT_CHARGE_TICKS)
          const dirX = pointingDelta.x / magnitude
          const dirY = pointingDelta.y / magnitude
          const speed = SHOT_SPEED_MIN + (SHOT_SPEED_MAX - SHOT_SPEED_MIN) * charge
          const up = SHOT_UP_MIN + (SHOT_UP_MAX - SHOT_UP_MIN) * charge

          const origin = { x: ballPos.data.x, y: ballPos.data.y, z: originZ }
          const velocity = { x: dirX * speed, y: dirY * speed }
          const tickSeconds = world.tickrate / 1000

          const gap = 1

          let posX = origin.x
          let posY = origin.y
          let posZ = origin.z
          let velZ = up

          const points: { x: number, y: number }[] = [{ x: 0, y: 0 }]
          const maxSteps = 90

          for (let step = 0; step < maxSteps; step += 1) {
            posX += velocity.x * tickSeconds * gap
            posY += velocity.y * tickSeconds * gap
            posZ += velZ * gap

            if (posZ <= 0) {
              posZ = 0
            }

            const dx = posX - origin.x
            const dy = posY - origin.y
            const dz = posZ - origin.z
            points.push({ x: dx, y: dy - dz })

            if (posZ <= 0) break

            velZ -= SHOT_GRAVITY * gap
          }

          renderable.visible = true
          for (let i = 0; i < points.length; i += 1) {
            let node = pointNodes[i]
            if (!node) {
              node = pixiGraphics().circle(0, 0, 1).fill({ color: pointColor, alpha: pointAlpha })
              pointNodes[i] = node
              g.addChild(node)
            }
            node.visible = true
            node.position.set(points[i].x, points[i].y)
          }

          for (let i = points.length; i < pointNodes.length; i += 1) {
            pointNodes[i].visible = false
          }
        }
      })()
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
