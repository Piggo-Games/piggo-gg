import { Color } from "three"
import { randomInt } from "./MathUtils"

export const colors = {
  piggo: 0xffc0cb,
  gold: 0xffee55,
  evening: 0xffd9c3,
  night: 0x9999cc,

  threeEvening: new Color(0xffd9c3),
  threeNight: new Color(0x9999cc)
}

export const lerp = (a: Color, b: Color, t: number) => {
  return a.clone().lerp(b, t)
}

export const randomColorBG = () => {
  return new Color(`rgb(0, ${randomInt(256)}, 256)`)
}
