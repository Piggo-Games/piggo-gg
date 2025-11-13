import { Client, Entity, HtmlDiv, HtmlImg, NPC, RefreshableDiv } from "@piggo-gg/core"

export const HtmlInventory = () => {

  let hInv: RefreshableDiv | undefined = undefined
  let init = false

  return Entity({
    id: "HtmlInventory",
    components: {
      npc: NPC({
        behavior: (_, world) => {
          if (!world.client) return


          if (!init) {
            init = true

            hInv = HInv(world.client)
            document.body.appendChild(hInv.div)
          }

          hInv?.update()
        }
      })
    }
  })
}

const HInv = (client: Client): RefreshableDiv => {

  const cells: HTMLDivElement[] = []
  const active: HTMLDivElement = activeCell()

  let lastSeenItems: (string | undefined)[] = []
  let activeItem = 0

  const div = HtmlDiv({
    width: "398px",
    height: "54px",
    bottom: "40px",
    left: "50%",
    transform: "translate(-50%)",
    visibility: "hidden",
    border: "3px solid #eeeeee",
    outline: "2px solid black",
    display: "flex"
  }, "inventory")

  for (let i = 0; i < 7; i++) {
    const cellDiv = cell()
    cells.push(cellDiv)
    div.appendChild(cellDiv)
  }

  div.appendChild(active)

  return {
    div,
    update: () => {
      const pc = client.character()
      if (!pc || !pc.components.inventory || !document.pointerLockElement) {
        lastSeenItems = []
        div.style.visibility = "hidden"
        return
      }
      div.style.visibility = "visible"

      const { items, activeItemIndex } = pc.components.inventory.data

      let updated = false

      // for (const [index, item] of entries(items)) {
      for (let i = 0; i < items.length; i++) {
        const item = items[i]?.[0]
        if (!lastSeenItems[i] && lastSeenItems[i] !== item) {
          lastSeenItems[i] = item
          updated = true
        }
      }

      if (activeItemIndex !== activeItem) {
        activeItem = activeItemIndex
        active.style.left = `${57 * activeItem - 3}px`
      }

      if (!updated) return

      for (let i = 0; i < items.length; i++) {
        const item = items[i]?.[0]
        if (!item) continue

        cells[i].innerHTML = ""

        const img = HtmlImg(`${item.split("-")[0]}.png`, {
          width: "46px",
          height: "46px",
          position: "relative",
          imageRendering: "pixelated",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)"
        })
        cells[i].appendChild(img)
      }
    }
  }
}

const cell = () => HtmlDiv({
  width: "53px",
  height: "50px",
  backgroundColor: "rgba(0, 0, 0, 0.3)",
  border: "2px solid #eeeeee",
  position: "relative",
  borderRadius: "0px"
})

const activeCell = () => HtmlDiv({
  width: "52px",
  height: "48px",
  left: "-3px",
  top: "-2px",
  // border: "5px solid rgb(0, 200, 250)",
  border: "5px solid rgb(250, 200, 100)",
  outline: "2px solid black",
  position: "absolute"
})
