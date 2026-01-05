import { entries, GunNames, randomChoice, World, XY, XYdistance } from "@piggo-gg/core"
import { dbToGain, Gain, getContext, getTransport, Player, Player as Tone } from "tone"

export type BounceSounds = "bounce1" | "bounce2" | "bounce3" | "bounce4"
export type BubbleSounds = "bubble" | "hitmarker" | "dice1" | "dice2" | "throw" | "jingle1" | "f9"
export type MusicSounds = "track1"
export type ClickSounds = "click1" | "click2" | "click3" | "cassettePlay" | "cassetteStop" | "reload" | "clink"
export type ToolSounds = "whiff" | "thud" | "slash"
export type EatSounds = "eat" | "eat2"
export type VolleySounds = "spike"
export type HoopsSounds = "swish"
export type LaserSounds = "laser1"

export type ValidSounds =
  BounceSounds | BubbleSounds | ClickSounds | MusicSounds | ToolSounds |
  GunNames | EatSounds | VolleySounds | HoopsSounds | LaserSounds

const load = (url: string, volume: number): Tone => {
  const player = new Tone({ url, volume: volume - 10 })
  return player.toDestination()
}

export type SoundPlayProps = {
  name: ValidSounds
  start?: number | string
  fadeIn?: number | string
  threshold?: {
    pos: XY // TODO xyz
    distance: number
  }
  volume?: number
}

export type Sound = {
  music: MusicSounds
  muted: boolean
  ready: boolean
  state: "closed" | "running" | "suspended" | "interrupted"
  tones: Record<ValidSounds, Tone>
  stop: (name: ValidSounds) => void
  stopMusic: () => void
  stopAll: () => void
  musicPlaying: () => boolean
  play: (props: SoundPlayProps) => boolean
  playChoice: (options: ValidSounds[], props?: Omit<SoundPlayProps, "name">) => boolean
}

export const Sound = (world: World): Sound => {

  // mute when tab is not visible
  document.addEventListener("visibilitychange", () => {
    sound.muted = document.hidden
    if (document.hidden) sound.stopAll()
  })

  // mute when window is not focused
  window.addEventListener("blur", () => {
    sound.muted = true
    sound.stopAll()
  })

  // unmute when window is focused
  window.addEventListener("focus", () => sound.muted = false)

  const players: Partial<Record<ValidSounds, Tone>> = {}

  const sound: Sound = {
    music: "track1",
    muted: false,
    state: "closed",
    ready: false,
    tones: {
      bounce1: load("bounce1.mp3", 0),
      bounce2: load("bounce2.mp3", 0),
      bounce3: load("bounce3.mp3", 0),
      bounce4: load("bounce4.mp3", 0),
      // birdsong1: load("birdsong1.mp3", -20),
      f9: load("f9.mp3", -5),
      jingle1: load("jingle1.mp3", -5),
      dice1: load("dice1.mp3", -5),
      dice2: load("dice2.mp3", -5),
      bubble: load("bubble.mp3", -10),
      throw: load("throw.mp3", -5),
      hitmarker: load("hitmarker.mp3", -5),
      // track2: load("track2.mp3", -10),
      track1: load("track1.mp3", -5),
      cassettePlay: load("cassettePlay.mp3", 0),
      cassetteStop: load("cassetteStop.mp3", -5),
      click1: load("click1.mp3", -5),
      click2: load("click2.mp3", 0),
      click3: load("click3.mp3", -10),
      deagle: load("deagle.mp3", -10),
      ak: load("ak.mp3", -25),
      awp: load("awp.mp3", -30),
      reload: load("reload.mp3", -10),
      clink: load("clink.mp3", -10),
      eat: load("eat.mp3", -5),
      eat2: load("eat2.mp3", -5),
      spike: load("spike.mp3", 5),
      swish: load("swish.mp3", 0),
      laser1: load("laser1.mp3", -15),

      thud: load("thud.mp3", -15),
      whiff: load("whiff.wav", -15),
      slash: load("slash.mp3", -17),
      // steps: load("steps.mp3", 0),
      // piano1: load("piano1.mp3", 5),
      // whoosh: load("whoosh.mp3", 0),
    },
    stop: (name: ValidSounds) => {
      const tone = sound.tones[name]
      if (tone) {
        try {
          const player = players[name]
          if (player) {
            player.stop()
          } else {
            tone.stop()
          }
        }
        catch (e) {
          console.error(`error while stopping sound ${tone}`)
        }
      }
    },
    stopMusic: () => {
      const musicSounds: MusicSounds[] = ["track1"]
      for (const name of musicSounds) sound.stop(name)
    },
    stopAll: () => {
      for (const [name, tone] of entries(sound.tones)) {
        if (tone.state === "started") {
          try {
            if (name.startsWith("track")) {
              // sound.mute = true
            } else {
              tone.stop()
            }
          } catch (e) {
            console.error(`error while stopping sound ${tone}`)
          }
        }
      }
    },
    musicPlaying: () => {
      const state = sound.tones[sound.music].state
      return state === "started"
    },
    playChoice: (options: ValidSounds[], props?: Omit<SoundPlayProps, "name">) => {
      if (sound.muted) return false

      const selected = randomChoice(options)

      if (selected) {
        sound.play({ name: selected, ...props })
        return true
      }

      return false
    },
    play: ({ name, start = 0, fadeIn = 0, threshold, volume }) => {
      if (sound.muted && !name.startsWith("track")) return false

      // check distance
      if (threshold) {
        const character = world.client?.character()
        if (character) {
          const distance = XYdistance(character.components.position.data, threshold.pos)
          if (distance > threshold.distance) return false
        }
      }

      try {
        if (sound.state !== "running") {
          sound.state = getContext().state
          getTransport().cancel().start("+0")
        }

        const tone = sound.tones[name]
        if (tone && tone.loaded) {

          if (volume) {
            const gain = new Gain(dbToGain(tone.volume.value) * (volume ?? 1)).toDestination()
            const player = new Player(tone.buffer).connect(gain)
            player.fadeOut = 0.7

            players[name] = player

            player.start(fadeIn, start)
          } else {
            tone.start(fadeIn, start)
          }

          return true
        }
      } catch (e) {
        console.error(`error while playing sound ${name}`)
        return false
      }

      return false
    }
  }
  return sound
}
