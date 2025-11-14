import { XYZ } from "@piggo-gg/core"

export type Block = XYZ & { type: number }
export type BlockPlan = Block[]

export type BlockColor = "tan" | "rebeccapurple" | "slategray" |
  "chocolate" | "saddlebrown" | "cadetblue" | "cornflowerblue" |
  "rosybrown" | "sandybrown" | "palevioletred" | "mediumseagreen"

export const BlockColors: BlockColor[] = [
  "tan", "rebeccapurple", "slategray", "chocolate", "saddlebrown", "cadetblue",
  "cornflowerblue", "rosybrown", "sandybrown", "palevioletred", "mediumseagreen"
]

export const nextColor = (current: BlockColor): BlockColor => {
  const index = BlockColors.indexOf(current)
  return BlockColors[(index + 1) % BlockColors.length]
}

export const BlockTypeInt: Record<BlockType, number> = {
  stone: 0,
  grass: 1,
  moss: 2,
  moonrock: 3,
  asteroid: 4,
  saphire: 5,
  spruce: 6,
  ruby: 7,
  white: 8,
  oak: 9,
  spruceLeaf: 10,
  oakLeaf: 11,
  marble: 12
}

export const BlockTypeString: Record<number, BlockType> = {
  0: "stone",
  1: "grass",
  2: "moss",
  3: "moonrock",
  4: "asteroid",
  5: "saphire",
  6: "spruce",
  7: "ruby",
  8: "white",
  9: "oak",
  10: "spruceLeaf",
  11: "oakLeaf",
  12: "marble"
}

export type BlockType =
  "white" | "stone" | "grass" | "moss" | "moonrock" |
  "asteroid" | "saphire" | "spruce" | "ruby" | "oak" |
  "spruceLeaf" | "oakLeaf" | "marble"

// export const BlockColors: Record<BlockType, [number, number, number]> = {
//   stone: [0x7b7b7b, 0x5E5E3E, 0x9b9b9b],
//   grass: [0x08d000, 0x6E260E, 0x7B3F00],
//   moss: [0x02bb60, 0x6E266E, 0x7B3F60],
//   moonrock: [0xcbdaf2, 0x98b0d9, 0xdddddd],
//   asteroid: [0x8b8b8b, 0x6E6E6E, 0xECF0F1],
//   saphire: [0x00afff, 0x007fff, 0x00cfff],
//   spruce: [0x330055, 0x550077, 0xaa00aa],
//   ruby: [0x660033, 0x880000, 0xff0000],
//   white: [0xffffff, 0xffffff, 0xffffff],
//   oak: [0x8B4513, 0xA0522D, 0xD2691E],
//   spruceLeaf: [0x00ff00, 0x00ff00, 0x00ff00],
//   oakLeaf: [0xF5F5DC, 0xFFF8DC, 0xFFE4C4],
//   marble: [0xeeeeee, 0xeeeeee, 0xeeeeee]
// }
