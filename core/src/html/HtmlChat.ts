import { Entity, entries, HtmlDiv, HtmlText, NPC, Position } from "@piggo-gg/core";

export const HtmlChat = (): Entity => {

  let init = false
  let inputText = ""

  let opened = false

  const fadeStack: number[] = []
  const messages: HtmlDiv[] = []

  const wrapper = HtmlDiv({
    width: "300px",
    height: "250px",
    right: "15px",
    bottom: "15px",
    transform: "translate(0%)",
    display: "flex",
    flexDirection: "column",
    border: ""
  })

  const border = HtmlDiv({
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    border: "2px solid white"
  })

  const chatDiv = HtmlDiv({
    flex: 1,
    left: "10px",
    marginBottom: "30px",
    position: "relative",
    top: "10px",
    whiteSpace: "pre-line",
    width: "280px",
    wordBreak: "break-all",
    overflowY: "scroll",
    display: "flex",
    flexDirection: "column-reverse",
    alignItems: "flex-start",
    border: ""
  })

  const input = HtmlText({
    style: {
      alignItems: "center",
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      border: "1px solid white",
      bottom: "10px",
      display: "flex",
      fontSize: "18px",
      left: "10px",
      minHeight: "30px",
      paddingLeft: "10px",
      paddingRight: "10px",
      position: "relative",
      width: "260px",
      wordBreak: "break-all"
    }
  })

  wrapper.appendChild(border)
  wrapper.appendChild(chatDiv)
  wrapper.appendChild(input)

  const chat = Entity({
    id: "html-chat",
    components: {
      position: Position(),
      npc: NPC({
        behavior: (_, world) => {
          if (!world.client || world.client.mobile) return

          if (!init) {
            init = true
            world.three?.append(wrapper)
          }

          const { inputBuffer, isOpen } = world.client.chat

          border.style.visibility = isOpen ? "visible" : "hidden"
          input.style.visibility = isOpen ? "visible" : "hidden"

          if (isOpen) {
            for (const message of messages) {
              message.style.visibility = "visible"
              message.style.opacity = "1"
            }
            opened = true
          } else if (opened) {
            opened = false
            for (const message of messages) {
              message.style.visibility = "hidden"
            }
          }

          const buffered = `${inputBuffer}│`
          if (buffered !== inputText) {
            inputText = buffered
            input.textContent = inputText
          }

          // get messages from this tick
          const { fresh } = world.messages
          for (const freshTick of fresh) {
            const messagesThisTick = world.messages.atTick(freshTick)
            if (messagesThisTick) {
              for (const [id, msgs] of entries(messagesThisTick)) {
                for (const msg of msgs) {
                  const entity = world.entity(id)

                  const from = entity ? entity.components.pc?.data.name || "noob" : null
                  const text = from ? `${from}: ${msg}` : msg

                  const message = HtmlText({
                    text,
                    style: {
                      position: "relative",
                      color: from ? "#ffffff" : "#00eeff"
                    }
                  })
                  chatDiv.prepend(message)

                  fadeStack.push(world.tick + 160)
                  messages.push(message)
                }
              }
            }
          }

          fresh.clear()

          if (!isOpen) {
            const len = fadeStack.length
            for (let i = 0; i < len; i++) {

              const diff = world.tick - fadeStack[i]
              const message = messages[(messages.length - len) + i]

              if (diff >= 20) {
                message.style.visibility = "hidden"
                message.style.opacity = "1"
                fadeStack.shift()
              } else {
                message.style.visibility = "visible"
                message.style.opacity = `${Math.max(0, 1 - diff / 20)}`
              }
            }
          }
        }
      })
    }
  })

  return chat
}
