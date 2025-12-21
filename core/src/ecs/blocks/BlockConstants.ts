import { XYZ } from "@piggo-gg/core"

export type Block = XYZ & { type: number }
export type BlockPlan = Block[]

export type BlockColor = "white" | "hotpink" | "lightpink" | "rebeccapurple" | "slategray" |
  "chocolate" | "saddlebrown" | "cadetblue" | "cornflowerblue" | "black" |
  "rosybrown" | "sandybrown" | "palevioletred" | "mediumseagreen" | "tan"

export const BlockColors: BlockColor[] = [
  "white", "hotpink", "lightpink", "rebeccapurple", "slategray",
  "chocolate", "saddlebrown", "cadetblue", "cornflowerblue",
  "rosybrown", "sandybrown", "palevioletred", "mediumseagreen", "black", "tan"
]

export const nextColor = (current: BlockColor, backward = false): BlockColor => {
  let nextIndex = BlockColors.indexOf(current)

  if (backward && nextIndex === 0) {
    nextIndex = BlockColors.length - 1
  } else if (backward) {
    nextIndex -= 1
  } else {
    nextIndex += 1
  }

  return BlockColors[nextIndex % BlockColors.length]
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
