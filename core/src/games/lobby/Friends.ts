import {
  colors, Entity, Friend, keys, PixiButton, pixiContainer,
  pixiGraphics, pixiText, Position, Renderable, values
} from "@piggo-gg/core"
import { Container, ContainerChild } from "pixi.js"

type FriendCard = Container<ContainerChild>

const FriendCard = (friend: Friend, y: number) => {

  const color = friend.online ? 0x00ff55 : 0xff0055

  const outline = pixiGraphics()
    .roundRect(10, 0, 180, 50, 3)
    .fill({ color: 0x000000, alpha: 1 })
    .stroke({ color, alpha: 0.95, width: 2 })

  const name = pixiText({
    text: friend.name,
    pos: { x: 100, y: 5 },
    anchor: { x: 0.5, y: 0 },
    style: { fontSize: 18, fill: 0xffffff }
  })

  const status = pixiText({
    text: friend.status,
    pos: { x: 100, y: 25 },
    anchor: { x: 0.5, y: 0 },
    style: { fontSize: 16, fill: 0xffffff }
  })

  const container = pixiContainer()
  container.position.set(0, y)
  container.addChild(outline, name, status)

  return container
}

export const Friends = (): Entity => {

  let addFriend: PixiButton
  let addFriendInput: PixiButton

  let send: PixiButton
  let cancel: PixiButton

  let addFriendInputText = ""

  let screenHeight = 0
  let outlineHeight = 0

  const outline = pixiGraphics()
  const drawOutline = () => {
    outline.clear()
    outline.roundRect(0, 0, 200, screenHeight - outlineHeight, 3)
      .fill({ color: 0x000000, alpha: 0.5 })
      .stroke({ color: colors.piggo, alpha: 0.8, width: 2, miterLimit: 0 })
  }

  const close = () => {
    addFriendInput.c.visible = false
    send.c.visible = false
    send.c.interactive = false
    cancel.c.visible = false
    cancel.c.interactive = false

    addFriend.c.visible = true
    addFriend.c.interactive = true

    addFriendInputText = ""
  }

  const open = () => {
    addFriendInput.c.visible = true
    send.c.visible = true
    send.c.interactive = true
    cancel.c.visible = true
    cancel.c.interactive = true

    addFriend.c.visible = false
    addFriend.c.interactive = false
  }

  let friendsList: Record<string, Friend> = {}
  let cards: FriendCard[] = []

  const friends = Entity<Position | Renderable>({
    id: "friends",
    components: {
      position: Position({ x: 10, y: 190, screenFixed: true }),
      renderable: Renderable({
        zIndex: 10,
        interactiveChildren: true,
        onTick: ({ world, client }) => {
          if (!world.pixi) return

          const h = world.client?.token ? 200 : 290

          if (outlineHeight !== h) {
            outlineHeight = h
            friends.components.position.setPosition({ y: outlineHeight - 10 })
            drawOutline()
          }

          if (screenHeight !== world.pixi.app.screen.height) {
            screenHeight = world.pixi.app.screen.height
            drawOutline()
          }

          if (addFriendInput.c.visible) {
            const all = client.bufferDown.all()

            for (const down of all) {
              if (down.hold) {
                continue
              } else if (down.key === "backspace") {
                addFriendInputText = addFriendInputText.slice(0, -1)
              } else {
                const key = down.key.toLowerCase()
                if (key.length === 1 && addFriendInputText.length < 15) {
                  addFriendInputText += key
                }
              }
            }

            const padding = world.tick % 40 < 20 ? "|" : " "

            const { text } = addFriendInput!.bt()
            text.text = `${(padding && addFriendInputText.length) ? " " : ""}${addFriendInputText}${padding}`
          }

          if (!client.token) {
            addFriend.c.interactive = false
            addFriend.c.alpha = 0.6
          }

          if (keys(friendsList).length === 0 && world.tick % 80 === 0) {

            // console.log("Fetching friends list")
            world.client?.friendsList((response) => {
              if ("error" in response) {
                friendsList = {}
              } else {
                friendsList = response.friends

                let i = 0
                for (const friend of values(friendsList)) {
                  i += 1

                  const card = FriendCard(friend, 10 + i * 80)
                  card.position.set(0, 0)
                  card.position.y = 35 + (i * 60)

                  cards.push(card)

                  friends.components.renderable.c.addChild(card)
                }
              }
            })
          }
        },
        setup: async (renderable, _, world) => {
          drawOutline()

          // todo separate renderables for buttons
          // renderable.setBevel({ rotation: 90, lightAlpha: 0.8, shadowAlpha: 0.4 })

          addFriendInput = PixiButton({
            visible: false,
            content: () => ({
              text: "",
              pos: { x: 100, y: 70 },
              anchor: { x: 0.5, y: 0.5 },
              style: { fontSize: 18, fill: 0xffffff },
              textPos: { x: 100, y: 70 },
              textAnchor: { x: 0.5, y: 0.5 },
              width: 180
            })
          })

          addFriend = PixiButton({
            alpha: 0.95,
            content: () => ({
              text: "add friend",
              pos: { x: 100, y: 30 },
              style: { fontSize: 18, fill: 0xffffff }
            }),
            onClick: open,
            onEnter: () => addFriend!.c.alpha = 1,
            onLeave: () => addFriend!.c.alpha = 0.95
          })

          cancel = PixiButton({
            alpha: 0.95,
            visible: false,
            interactive: false,
            content: () => ({
              text: "cancel",
              pos: { x: 52, y: 30 },
              width: 84,
              style: { fontSize: 18, fill: 0xff0055 },
              fillColor: 0x000000,
              strokeColor: 0xff0055
            }),
            onClick: close,
            onEnter: () => cancel.c.alpha = 1,
            onLeave: () => cancel.c.alpha = 0.95
          })

          send = PixiButton({
            alpha: 0.95,
            visible: false,
            interactive: false,
            content: () => ({
              text: "send",
              pos: { x: 148, y: 30 },
              width: 84,
              style: { fontSize: 18, fill: 0x00ff55 },
              fillColor: 0x000000,
              strokeColor: 0x00ff55,
            }),
            onClick: () => {
              const name = addFriendInputText.trim()
              world.client?.friendsAdd(name, (response) => {
                // toast.success("Friend request sent")
                close()
              })
            },
            onEnter: () => send.c.alpha = 1,
            onLeave: () => send.c.alpha = 0.95
          })

          renderable.c.addChild(outline, addFriend.c, addFriendInput.c, send.c, cancel.c)
          for (const card of cards) {
            renderable.c.addChild(card)
          }
        }
      })
    }
  })
  return friends
}
