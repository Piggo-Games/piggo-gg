import { Color } from "three"

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
