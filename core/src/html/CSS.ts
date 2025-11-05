type PrimaryColor = "red" | "green" | "blue" | "yellow" | "purple" | "orange" | "black" | "white" | "gray" | "lightgray" | "darkgray" | "silver" | "gold" | "pink" | "cyan" | "magenta" | "lime" | "teal" | "navy" | "maroon" | "olive" | "brown"
export type LexColor = PrimaryColor | `#${string}` | `rgba(${number}, ${number}, ${number}, ${number})`

export type CSS = Partial<{
  alignItems: "center" | "flex-start" | "flex-end" | "stretch"
  background: string
  backgroundClip: "border-box" | "content-box" | "padding-box" | "text" | "content-box, border-box"
  backgroundColor: LexColor
  backgroundImage: string
  backgroundOrigin: "border-box" | "content-box" | "padding-box"
  border: string
  borderBottom: string
  borderImage: `linear-gradient(${string}) ${number}`
  borderRadius: `${number}px` | `${number}%`
  borderStyle: "solid" | "dashed" | "dotted"
  bottom: `${number}%` | `${number}px`
  boxSizing: "border-box" | "content-box"
  clipPath: string
  color: LexColor
  cursor: "pointer" | "default" | "not-allowed"
  display: "block" | "inline-block" | "flex" | "inline-flex" | "none"
  flex: number | `${number} ${number} auto`
  flexDirection: "row" | "column" | "row-reverse" | "column-reverse"
  flexShrink: number
  float: "left" | "right" | "none"
  fontFamily: "Courier New" | "Arial"
  fontSize: `${number}px`
  fontWeight: "normal" | "bold" | "bolder" | "lighter" | number
  gap: `${number}px` | `${number}%`
  height: "inherit" | `${number}px` | `${number}%` | "auto" | `${number}vh` | `${number}dvh` | "fit-content"
  imageRendering: "auto" | "crisp-edges" | "pixelated"
  justifyContent: "center" | "flex-start" | "flex-end" | "space-between" | "space-around"
  left: `${number}%` | `${number}px` | `${number}dvh` | `calc(${string})`
  lineHeight: `${number}px`
  margin: `${number}px` | `${number}%` | "0 auto"
  marginBottom: `${number}px` | `${number}%` | "env(safe-area-inset-bottom)"
  marginLeft: `${number}px` | `${number}%` | "env(safe-area-inset-left)"
  marginRight: `${number}px` | `${number}%` | "env(safe-area-inset-right)"
  marginTop: `${number}px` | `${number}%` | "env(safe-area-inset-top)"
  maxHeight: `${number}%` | `${number}px` | `${number}dvh`
  maxWidth: `${number}%` | `${number}px`
  minHeight: `${number}px` | `${number}%` | `${number}dvh` | 0
  minWidth: `${number}px` | `${number}%`
  msOverflowStyle: "none"
  opacity: number | `${number}`
  outline: "none" | `${number}px solid ${string}`
  outlineOffset: `${number}px`
  overflow: "visible" | "hidden" | "scroll" | "auto"
  overflowY: "visible" | "hidden" | "scroll" | "auto"
  padding: `${number}px` | `${number}%`,
  paddingBottom: `${number}px` | `${number}%`
  paddingLeft: `${number}px` | `${number}%`
  paddingRight: `${number}px` | `${number}%`
  paddingTop: `${number}px` | `${number}%`
  pointerEvents: "none" | "auto"
  position: "absolute" | "relative" | "fixed" | "sticky" | "static"
  right: `${number}%` | `${number}px`
  scrollbarWidth: "auto" | "thin" | "none"
  textAlign: "left" | "center" | "right" | "justify"
  textDecoration: "none" | "underline" | "line-through"
  textDecorationStyle: "solid" | "dashed" | "dotted"
  textShadow: "none" | `${number}px ${number}px ${number}px rgba(${number}, ${number}, ${number}, ${number})`
  top: `${number}%` | `${number}px` | `${number}dvh`
  touchAction: "none" | "pan-x" | "pan-y" | "pan-x pan-y" | "manipulation"
  transform: `translate(${number}%)` | `translate(${number}%, ${number}%)` | `rotate(${number}deg)`
  transition: string
  userSelect: "none" | "auto" | "text" | "all"
  visibility: "visible" | "hidden"
  whiteSpace: "normal" | "nowrap" | "pre" | "pre-wrap" | "pre-line"
  width: `${number}px` | `${number}%` | "auto" | "inherit" | "fit-content"
  wordBreak: "normal" | "break-word" | "break-all"
  zIndex: number
}>
