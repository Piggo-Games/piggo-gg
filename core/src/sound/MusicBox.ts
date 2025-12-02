import { Entity, MusicSounds, pixiGraphics, Position, Renderable, sin } from "@piggo-gg/core"
import { Graphics } from "pixi.js/lib"

export const MusicBox = (): Entity => {

  let discMarks: Graphics | null = null
  let arm: Graphics | null = null
  let disc: Graphics | null = null
  let light: Graphics | null = null

  let timeout = 0
  let animation = 0
  let lightColor = 1
  let lightDirection = -1

  let state: "stop" | "play" = "stop"
  let tracks: MusicSounds[] = ["track1"]
  let trackIndex = 0

  let lastMouseY = 0
  let dialDragging = false
  let targetVolume = -20
  let discHovered = false

  let discColors: Record<MusicSounds, number> = {
    track1: 0xccaa00,
    // birdsong1: 0x00aa00
  }

  const redraw = () => {
    if (disc === null) disc = pixiGraphics()
    disc.clear()
      .circle(0, 0, 50)
      .fill(0x1f1f1f)
      .stroke({ color: 0xdddddd, width: 2 })
      .circle(0, 0, 10)
      .fill(discColors[tracks[trackIndex]])
      .circle(0, 0, 2)
      .fill(0x000000)
  }

  const drawLight = (color?: number) => {
    if (light === null) {
      light = pixiGraphics()
    } else {
      if (light.context) light.clear()
    }
    light.circle(0, 0, 6).fill(color ? color : state === "play" ? 0x00ee00 : 0xff0000)
  }

  const musicbox = Entity<Position>({
    id: "musicbox",
    // persists: true,
    components: {
      position: Position({ x: 400, y: 650, screenFixed: true }),
      renderable: Renderable({
        zIndex: 11,
        interactiveChildren: true,
        onTick: ({ renderable, world }) => {
          if (!world.client) return

          const { sound } = world.client
          const currentSong = sound.tones[tracks[trackIndex]]

          if (timeout > 0) timeout -= 1

          if (state === "play" && animation > 0) animation -= 1

          if (state === "play" && timeout === 0 && currentSong?.state === "stopped") {
            trackIndex = (trackIndex + 1) % tracks.length
            redraw()
            sound.play({ name: tracks[trackIndex] })
            timeout = 40
          }

          if (state === "play" && currentSong) {
            currentSong?.set({ volume: targetVolume })
          }

          if (world.entity("pixiMenu")?.components.renderable?.visible === true) {
            renderable.visible = true
            const { width, height } = world.pixi!.wh()


            musicbox.components.position.setPosition({ x: width / 2, y: height / 2 + 80 })
          } else if (world.game.id === "lobby") {
            renderable.visible = true
            const { width } = world.pixi!.wh()
            musicbox.components.position.setPosition({ x: width / 2, y: 650 })
          } else {
            renderable.visible = false
          }
        },
        onRender: ({ delta }) => {
          if (!discMarks || !arm) return

          // rotate the disc
          if (state === "play" && animation === 0) discMarks.rotation += delta / 1800

          // rotate the arm
          if (state === "play" && arm.rotation <= 0.92) arm.rotation += delta / 1500
          if (state === "stop" && arm.rotation > 0) arm.rotation -= delta / 1500

          arm.rotation = Math.max(0, arm.rotation)
        },
        setChildren: async (_, world) => {

          const base = Renderable({
            setup: async (r) => {
              r.c = pixiGraphics()
                .roundRect(-90, -70, 180, 140, 10)
                .fill(0x472709)
                .stroke({ color: 0xffffff, width: 2 })

              r.setBevel({ rotation: 90, lightAlpha: 1, shadowAlpha: 0.3 })
            }
          })

          const volumeDial = Renderable({
            position: { x: -70, y: -50 },
            onRender: ({ renderable, world }) => {
              if (dialDragging && !world.client?.bufferDown.get("mb1")) {
                dialDragging = false
                lastMouseY = 0
                renderable.setGlow()
              }
            },
            onTick: ({ renderable, client }) => {
              if (dialDragging) {
                const xy = client.controls.mouse

                if (lastMouseY === 0) {
                  lastMouseY = xy.y
                  return
                }

                const deltaY = xy.y - lastMouseY
                lastMouseY = xy.y

                renderable.c.position.y += deltaY * 2

                renderable.c.position.y = Math.max(-90, renderable.c.position.y)
                renderable.c.position.y = Math.min(-10, renderable.c.position.y)

                targetVolume = -20 - 10 * (renderable.c.position.y + 50) / 40
              }
            },
            setup: async (r) => {
              const dial = pixiGraphics()
                .roundRect(-9, 40, 18, 18, 6)
                .fill(0xdd99aa)

              dial.interactive = true

              dial.onpointerdown = () => {
                r.setGlow({ outerStrength: 1 })
                dialDragging = true
              }

              dial.onpointerover = () => {
                r.setGlow({ outerStrength: 1 })
              }

              dial.onpointerout = () => {
                if (dialDragging) return
                r.setGlow()
              }

              r.c = dial

              r.setBevel({ rotation: 90, lightAlpha: 0.9, shadowAlpha: 0.4 })
            }
          })

          const discRenderable = Renderable({
            onRender: ({ renderable, world, delta }) => {
              if (!discHovered && state === "stop") {
                renderable.setGlow({ color: 0xffff00, outerStrength: 0.7 + sin((world.tick + delta / 25) / 16) * 1 })
              }
            },
            setup: async (r) => {
              redraw()

              r.c = disc!

              disc!.interactive = true

              disc!.onclick = () => {
                if (timeout) return

                if (state === "stop") {
                  state = "play"
                  world.client?.sound.play({ name: "cassettePlay" })
                  world.client?.sound.play({ name: tracks[trackIndex], fadeIn: "+1" })

                  timeout = 60
                  animation = 40
                } else {
                  state = "stop"
                  world.client?.sound.play({ name: "cassetteStop" })
                  world.client?.sound.stop(tracks[trackIndex])

                  // trackIndex = (trackIndex + 1) % tracks.length
                  redraw()

                  timeout = 50
                }

                drawLight()
              }
              disc!.onpointerenter = () => {
                discHovered = true
                r.setGlow({ outerStrength: 2 })
              }
              disc!.onpointerleave = () => {
                discHovered = false
                r.setGlow()
              }
            }
          })

          const armBaseRenderable = Renderable({
            setup: async (r) => {
              const armbase = pixiGraphics()
                .circle(65, -50, 6)
                .fill(0xe8e7e6)

              r.c = armbase

              r.setBevel({ rotation: 90, lightAlpha: 1, shadowAlpha: 0.3 })
            }
          })

          const other = Renderable({
            setup: async (r) => {
              discMarks = pixiGraphics()
                .arc(0, 0, 40, 0, Math.PI / 2)
                .stroke({ color: 0xdddddd, width: 2 })
                .arc(0, 0, 40, -Math.PI, -Math.PI / 2)
                .stroke({ color: 0xdddddd, width: 2 })

              const slide = pixiGraphics()
                .moveTo(-70, -45)
                .lineTo(-70, 45)
                .stroke({ color: 0x000000, width: 4 })

              arm = pixiGraphics({ x: 65, y: -50 })
                .lineTo(0, 48)
                .stroke({ color: 0xe8e7e6, width: 3 })

              r.c.addChild(slide, discMarks, arm)
            }
          })

          const lightRenderable = Renderable({
            position: { x: 65, y: 45 },
            onTick: () => {
              if (state !== "play") {
                drawLight()
                lightColor = 1
                lightDirection = -1
                return
              }

              if (lightColor >= 1) lightDirection = -1
              if (lightColor <= 0) lightDirection = 1

              lightColor += 0.01 * lightDirection

              const newColor = 0xbb + (lightColor * 0x44) << 8
              drawLight(newColor)
            },
            setup: async (r) => {
              drawLight()

              r.c = light!

              r.setBevel({ rotation: 90, lightAlpha: 0.8, shadowAlpha: 0.2 })
            }
          })

          return [base, discRenderable, armBaseRenderable, other, lightRenderable, volumeDial]
        }
      })
    }
  })
  return musicbox
}
