import {
  Actions, Character, ClientSystemBuilder, Entity, Input, World,
  XY, cos, isTypingEvent, max, min, round, screenWH, sin
} from "@piggo-gg/core"

// handles keyboard/mouse/joystick inputs
export const InputSystem = ClientSystemBuilder({
  id: "InputSystem",
  init: (world) => {
    const pixi = world.pixi
    const client = world.client!

    let { mouse } = client.controls

    const localAim = () => ({ ...client.controls.localAim })

    const validChatCharacters: Set<string> = new Set("abcdefghijklmnopqrstuvwxyz1234567890!@#$%^&*()_+-=[]{}\\|:'\",./<>?`~ ")
    const charactersPreventDefault = new Set(["'", "/", " ", "escape", "tab", "enter", "capslock"])
    const mappedKeys: Record<string, string> = {
      "!": "1", "@": "2", "#": "3", "$": "4", "%": "5", "^": "6", "&": "7", "*": "8", "(": "9", ")": "0"
    }

    let backspace = 0

    window.addEventListener("wheel", (event) => {

      const amount = event.deltaY
      if (amount > 0.5) {
        client.bufferScroll += amount
        client.bufferDown.push({ key: "scrolldown", mouse, aim: localAim(), tick: world.tick, hold: 0, delta: 0 })
      } else {
        client.bufferScroll += amount
        client.bufferDown.push({ key: "scrollup", mouse, aim: localAim(), tick: world.tick, hold: 0, delta: 0 })
      }
    })

    window.addEventListener("pointermove", (event) => {
      if (client.controls.left.active || client.controls.right.active) return

      if (document.pointerLockElement) {
        // localAim
        client.controls.moveLocal({
          x: event.movementX * 0.001,
          y: event.movementY * 0.001
        })

        // mouseScreen
        const { w, h } = screenWH()
        client.controls.mouseScreen = {
          x: min(max(0, client.controls.mouseScreen.x + event.movementX), w),
          y: min(max(0, client.controls.mouseScreen.y + event.movementY), h)
        }
      } else {
        client.controls.mouseScreen = {
          x: event.offsetX,
          y: event.offsetY
        }
      }

      // mouse
      if (pixi) client.controls.mouse = pixi.camera.toWorldCoords(client.controls.mouseScreen)
    })

    document.addEventListener("pointerdown", (event) => {
      if (client.busy) return
      if (world.tick <= client.clickThisFrame.value) return

      // @ts-expect-error
      const target = event.target?.tagName
      if (!["CANVAS", "BODY"].includes(target)) return

      const key = event.button === 0 ? "mb1" : "mb2"

      client.bufferDown.push({ key, mouse, aim: localAim(), tick: world.tick, hold: 0, delta: performance.now() - world.time })
    })

    document.addEventListener("pointerup", (event) => {
      const key = event.button === 0 ? "mb1" : "mb2"

      if (key === "mb1") {
        const pc = client.character()
        const release = pc?.components.input.inputMap.release[key]

        if (pc && release) {
          release({
            // @ts-expect-error
            mouse, aim: localAim(), client, entity: pc, world, tick: world.tick, hold: 0, target: event.target?.localName ?? ""
          })
          client.bufferDown.remove(key)
          return
        }
      }

      client.bufferDown.remove(key)
      client.bufferUp.push({ key, mouse, aim: localAim(), tick: world.tick, hold: 0, delta: 0 })
    })

    document.addEventListener("keyup", (event: KeyboardEvent) => {
      if (document.hasFocus()) {
        let key = event.key.toLowerCase()

        if (charactersPreventDefault.has(key)) event.preventDefault()

        // handle released backspace
        if (client.chat.isOpen && key === "backspace") backspace = 0

        // mapped keys
        if (mappedKeys[key]) {
          key = mappedKeys[key]
        }

        const down = client.bufferDown.get(key)
        if (!down) return

        if (key === "escape") {
          const pc = client.character()
          if (pc) {
            pc.components.input.inputMap.release[key]?.({
              mouse, aim: localAim(), entity: pc, world, tick: world.tick, hold: down.hold, client
            })
            client.bufferDown.remove(key)
            return
          }
        }

        // add to bufferUp
        client.bufferUp.push({
          key, mouse, aim: localAim(), tick: world.tick, hold: down.hold, delta: 0
        })

        // remove from bufferedDown
        client.bufferDown.remove(key)
      }
    })

    document.addEventListener("keypress", (event) => {
      if (document.hasFocus() && (charactersPreventDefault.has(event.key))) {
        event.preventDefault()
      }
    })

    document.addEventListener("keydown", (event) => {
      if (document.hasFocus()) {
        let key = event.key.toLowerCase()

        // ignore noisy capslock events
        if (key === "capslock" && !event.getModifierState("CapsLock")) return

        // prevent defaults
        if (charactersPreventDefault.has(key)) event.preventDefault()

        const { isOpen, inputBuffer } = client.chat

        if (isTypingEvent(event)) return

        // add to buffer
        if (!client.bufferDown.get(key)) {

          // toggle chat
          if (key === "enter" && !isOpen) client.chat.isOpen = true
          else if (isOpen && (key === "enter" || key === "escape")) {

            // push the message to messages
            if (inputBuffer.length > 0) {
              const message = inputBuffer
              world.messages.push(world.tick + 1, client.playerId() ?? "", message)
            }

            client.chat.inputBuffer = ""
            client.chat.isOpen = false
          }

          // handle backspace
          if (client.chat.isOpen && key === "backspace") {
            client.chat.inputBuffer = client.chat.inputBuffer.slice(0, -1)
            backspace = world.tick + 3
          }

          // push to chatBuffer or bufferedDown
          if (client.chat.isOpen && validChatCharacters.has(key)) {
            client.chat.inputBuffer += key
          } else {

            // mapped keys
            if (mappedKeys[key]) {
              key = mappedKeys[key]
            }

            client.bufferDown.push({ key, mouse, aim: localAim(), tick: world.tick, hold: 0, delta: 0 })
          }
        }
      }
    })

    const handleInputForCharacter = (character: Character, world: World) => {
      // copy the input buffer
      let buffer = client.bufferDown.copy()
      let bufferUp = client.bufferUp.copy()

      // check for actions
      const { input, actions, position, inventory } = character.components

      const { x, y } = position.data

      // update position.pointing
      if (world.pixi) {
        const angle = Math.atan2(mouse.y - y, mouse.x - x)
        const pointing = round((angle + Math.PI) / (Math.PI / 4)) % 8

        let pointingDelta: XY

        if (world.pixi?.camera.focus) {
          const { width, height } = world.pixi?.wh()
          pointingDelta = {
            x: round(client.controls.mouseScreen.x - (width / 2), 2),
            y: round(client.controls.mouseScreen.y - (height / 2), 2)
          }
        } else {
          pointingDelta = {
            x: round(mouse.x - x, 2),
            y: round(mouse.y - (y - position.data.z), 2)
          }
        }

        if (actions.actionMap["point"]) {
          world.actions.push(world.tick, character.id, {
            actionId: "point", playerId: client.playerId(), params: {
              pointing, pointingDelta, aim: localAim()
            }
          })
        }
      } else if (world.three) {
        if (actions.actionMap["point"]) {
          world.actions.push(world.tick, character.id, {
            actionId: "point", playerId: client.playerId(), params: {
              pointing: 0, pointingDelta: 0, aim: localAim()
            }
          })
        }
      }

      // handle joystick input
      if ((client.controls.left.power ?? 0) > 0.01) {
        const joystickAction = input.inputMap.joystick({ character, world, client })
        if (joystickAction) world.actions.push(world.tick, character.id, joystickAction)
      }

      // handle standalone and composite (a,b) input controls
      for (const keyPress in input.inputMap.press) {
        const keyMouse = buffer.get(keyPress)
        if (keyPress.includes(",")) {
          const inputKeys = keyPress.split(",")

          // check for multiple keys pressed at once
          if (inputKeys.every((key) => buffer.get(key))) {

            // run the callback
            const controllerInput = input.inputMap.press[keyPress]
            if (controllerInput != null) {
              const invocation = controllerInput({
                mouse: { ...client.controls.mouse },
                aim: localAim(),
                entity: character,
                character,
                world,
                client,
                hold: keyMouse?.hold ?? 0
              })
              if (invocation && actions.actionMap[invocation.actionId]) {
                invocation.playerId = client.playerId()
                invocation.characterId = character.id
                world.actions.push(world.tick, character.id, invocation)
              }
            }

            // remove each key from the buffer
            inputKeys.forEach((key) => buffer.remove(key))
          }
        } else if (keyMouse) {

          // check for single key pressed
          const controllerInput = input.inputMap.press[keyPress]
          if (controllerInput) {
            const invocation = controllerInput({
              mouse: { ...client.controls.mouse },
              aim: localAim(),
              entity: character,
              character,
              world,
              client,
              tick: keyMouse.tick,
              hold: keyMouse.hold
            })
            if (invocation && actions.actionMap[invocation.actionId]) {
              invocation.playerId = client.playerId()
              invocation.characterId = character.id
              world.actions.push(world.tick, character.id, invocation)
            }
          }

          // remove the key from the buffer
          buffer.remove(keyPress)
        }
      }

      // handle key releases
      for (const keyUp in input.inputMap.release) {
        const keyMouse = bufferUp.get(keyUp)

        if (keyMouse) {
          const controllerInput = input.inputMap.release[keyUp]
          if (controllerInput != null) {
            const invocation = controllerInput({
              mouse,
              aim: localAim(),
              entity: character,
              tick: world.tick,
              world,
              client,
              hold: keyMouse.hold
            })
            if (invocation && actions.actionMap[invocation.actionId]) {
              invocation.playerId = client.playerId()
              invocation.characterId = character.id
              world.actions.push(world.tick, character.id, invocation)
            }
          }

          bufferUp.remove(keyUp)
        }
      }

      // handle character inventory
      const activeItem = inventory?.activeItem(world)
      if (activeItem) {

        for (const keyPress in activeItem.components.input?.inputMap.press) {
          const keyMouse = buffer.get(keyPress)

          if (keyMouse) {
            const invocation = activeItem.components.input?.inputMap.press[keyMouse.key]?.({
              aim: localAim(),
              character,
              entity: activeItem,
              hold: keyMouse.hold,
              mouse: { ...client.controls.mouse },
              client,
              tick: keyMouse.tick,
              world,
              delta: keyMouse.delta
            })
            if (invocation && activeItem.components.actions.actionMap[invocation.actionId]) {
              invocation.playerId = client.playerId()
              invocation.characterId = character.id
              world.actions.push(world.tick, activeItem.id, invocation)
            }
          }
        }
      }
    }

    const handleInputForUIEntity = (entity: Entity<Input | Actions>, world: World) => {
      // copy the input buffer
      let bufferDown = client.bufferDown.copy()
      let bufferUp = client.bufferUp.copy()

      // check for actions
      const { input, actions } = entity.components

      for (const inputKey in input.inputMap.press) {
        const keyMouse = bufferDown.get(inputKey)
        if (keyMouse) {
          const { tick, hold } = keyMouse

          // invoke the callback
          const controllerInput = input.inputMap.press[inputKey]
          if (controllerInput != null) {
            const invocation = controllerInput({
              aim: localAim(), mouse, entity, world, client, hold, tick
            })
            if (invocation && actions.actionMap[invocation.actionId]) {
              invocation.playerId = client.playerId()
              if (invocation.offline) {
                world.actions.push(world.tick, entity.id, invocation)
              } else {
                world.actions.push(world.tick, entity.id, invocation)
              }
            }
          }

          bufferDown.remove(inputKey)
        }
      }

      for (const keyUp in input.inputMap.release) {

        if (bufferUp.get(keyUp)) {
          const controllerInput = input.inputMap.release[keyUp]
          if (controllerInput != null) {
            const invocation = controllerInput({
              aim: localAim(), mouse, entity, world, client, hold: 0
            })
            if (invocation && actions.actionMap[invocation.actionId]) {
              invocation.playerId = client.playerId()
              world.actions.push(world.tick, entity.id, invocation)
            }
          }

          bufferUp.remove(keyUp)
        }
      }
    }

    let last = 0

    return {
      id: "InputSystem",
      query: ["input", "actions", "position"],
      priority: 1,
      skipOnRollback: true,
      onRender: () => {
        if (!client.mobile) return

        const { power, angle, active } = client.controls.right

        if (!active) {
          last = 0
          return
        } else if (last === 0) {
          last = performance.now()
          return
        }

        const delta = performance.now() - last
        last = performance.now()

        client.controls.moveLocal({
          x: power * cos(angle) * delta / 400,
          y: power * sin(angle) * delta / 400
        })
      },
      onTick: (enitities: Entity<Input | Actions>[]) => {
        client.bufferDown.updateHold(world.tick)

        // clear buffer if the window is not focused
        if (!document.hasFocus() && !client.mobile) {
          client.bufferDown.clear()
          client.bufferUp.clear()
          return
        }

        // handle character input
        const character = client.character()
        if (character && !client.busy) handleInputForCharacter(character, world)

        // handle buffered backspace
        if (client.chat.isOpen && backspace && (world.tick > backspace) && (world.tick - backspace) % 2 === 0) {
          client.chat.inputBuffer = client.chat.inputBuffer.slice(0, -1)
        }

        // handle UI input (todo why networked ?)
        enitities.forEach((entity) => {
          const { networked } = entity.components
          if (!networked) handleInputForUIEntity(entity, world)
        })

        client.bufferUp.clear()
        client.bufferDown.remove("capslock") // capslock doesn't emit keyup event (TODO bug on windows, have to hit capslock twice)
        client.bufferDown.remove("scrolldown")
        client.bufferDown.remove("scrollup")
      }
    }
  }
})
