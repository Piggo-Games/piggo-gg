import {
  Character, LobbyCreate, LobbyJoin, NetMessageTypes, Player, RequestData,
  RequestTypes, World, randomPlayerId, Sound, randomHash, AuthLogin,
  FriendsList, Pls, NetClientReadSystem, NetClientWriteSystem, ProfileGet,
  ProfileCreate, MetaPlayers, FriendsAdd, KeyBuffer, isMobile, LobbyList,
  BadResponse, LobbyExit, XY, round, max, min, GameTitle
} from "@piggo-gg/core"
import { decode, encode } from "@msgpack/msgpack"

const servers = {
  local: "ws://localhost:3000",
  dev: "wss://piggo-api-staging.up.railway.app",
  production: "wss://api.piggo.gg"
} as const

export const hosts = {
  local: "http://localhost:8000",
  dev: "https://dev.piggo.gg",
  production: "https://piggo.gg"
}

type APICallback<R extends RequestTypes = RequestTypes> = (response: R["response"] | BadResponse) => void
type Callback<R extends RequestTypes = RequestTypes> = (response: R["response"]) => void

export type Client = {
  bufferDown: KeyBuffer
  bufferUp: KeyBuffer
  bufferScroll: number
  busy: boolean
  chat: {
    inputBuffer: string
    isOpen: boolean
  }
  clickThisFrame: {
    value: number
    set: (value: number) => void
    reset: () => void
  }
  controls: {
    left: { angle: number, power: number, active: boolean }
    right: { angle: number, power: number, active: boolean }
    mouse: XY
    mouseScreen: XY
    localAim: XY
    localHit: { tick: number, headshot: boolean }
    moveLocal: (xy: XY, flying?: boolean) => void
  }
  env: "local" | "dev" | "production"
  lastMessageTick: number
  lobbyId: string | undefined
  net: {
    synced: boolean
    connected: boolean
    ms: number
    lobbyId: string | undefined
  },
  menu: boolean
  mobile: undefined | {
    horizontal: () => boolean
  }
  player: Player
  sound: Sound
  token: string | undefined
  ws: WebSocket
  isLeader: () => boolean
  playerId: () => string
  playerName: () => string
  character: () => Character | undefined
  lobbyCreate: (game: GameTitle, callback?: Callback<LobbyCreate>) => void
  lobbyJoin: (lobbyId: string, callback: Callback<LobbyJoin>) => void
  lobbyLeave: () => void
  lobbyList: (callback: Callback<LobbyList>) => void
  metaPlayers: (callback: Callback<MetaPlayers>) => void
  authLogin: (jwt: string, callback?: Callback<AuthLogin>) => void
  logout: () => void
  aiPls: (prompt: string, callback: Callback<Pls>) => void
  pointerLock: () => void
  pointerUnlock: () => void
  profileCreate: (name: string, callback: Callback) => void
  profileGet: (callback?: Callback) => void
  friendsAdd: (name: string, callback: Callback) => void
  friendsList: (callback: Callback<FriendsList>) => void
}

export type ClientProps = {
  world: World
}

export const Client = ({ world }: ClientProps): Client => {

  let requestBuffer: Record<string, APICallback> = {}

  const player = Player({ id: randomPlayerId() })
  world.addEntity(player)

  const request = <R extends RequestTypes>(data: Omit<R, "response">, callback: APICallback<R>) => {
    if (client.ws.readyState !== WebSocket.OPEN) return

    const requestData: RequestData = { type: "request", data }
    client.ws.send(encode(requestData))
    requestBuffer[requestData.data.id] = callback

    // TODO handle timeout
  }

  const env = location?.hostname === "piggo.gg" ? "production" : location?.hostname === "dev.piggo.gg" ? "dev" : "local"

  const client: Client = {
    bufferDown: KeyBuffer(),
    bufferUp: KeyBuffer(),
    bufferScroll: 0,
    busy: false,
    chat: {
      inputBuffer: "",
      isOpen: false
    },
    clickThisFrame: {
      value: 0,
      set: (value: number) => client.clickThisFrame.value = value,
      reset: () => client.clickThisFrame.value = 0
    },
    controls: {
      left: { angle: 0, power: 0, active: false },
      right: { angle: 0, power: 0, active: false },
      mouse: { x: 0, y: 0 },
      mouseScreen: { x: 0, y: 0 },
      localAim: { x: 0, y: 0 },
      localHit: { tick: -100, headshot: false },
      moveLocal: ({ x, y }: XY) => {

        const mouseSensitivity = world.settings<{ mouseSensitivity: number }>().mouseSensitivity
        if (mouseSensitivity) {
          x *= mouseSensitivity
          y *= mouseSensitivity
        }

        client.controls.localAim.x = client.controls.localAim.x - x
        client.controls.localAim.y = client.controls.localAim.y - y
        // client.controls.localAim.x = round(client.controls.localAim.x - x, 5)
        // client.controls.localAim.y = round(client.controls.localAim.y - y, 5)

        const flying = client.character()?.components.position.data.flying ?? false
        const cameraMode = world.three?.camera.mode ?? "third"

        // limits
        const lower = -1.57
        const upper = (cameraMode === "third" && !flying) ? 0.335 : -lower

        client.controls.localAim.y = max(lower, min(upper, client.controls.localAim.y))
      }
    },
    env,
    lastMessageTick: 0,
    lobbyId: undefined,
    net: {
      synced: false,
      connected: false,
      ms: 0,
      lobbyId: undefined
    },
    menu: false,
    mobile: isMobile() ? {
      horizontal: () => window.outerHeight < window.outerWidth
    } : undefined,
    player,
    sound: Sound(world),
    token: undefined,
    ws: new WebSocket(servers[env]),
    isLeader: () => {
      return !client.net.lobbyId || client.player.components.pc.data.leader
    },
    playerId: () => {
      return client.player.id
    },
    playerName: () => {
      return client.player.components.pc.data.name
    },
    character: () => {
      return client.player.components.controlling.getCharacter(world)
    },
    pointerLock: () => {
      document.body.requestPointerLock({ unadjustedMovement: true })
    },
    pointerUnlock: () => {
      document.exitPointerLock()
    },
    lobbyCreate: (game, callback) => {
      request<LobbyCreate>({ route: "lobby/create", type: "request", id: randomHash(), game }, (response) => {
        if ("error" in response) {
          console.error("failed to create lobby:", response.error)
        } else {
          client.lobbyId = response.lobbyId
          world.addSystemBuilders([NetClientReadSystem, NetClientWriteSystem])
          world.messages.clearBeforeTick(world.tick)
          world.tick = -100
          world.game.started = -100
          callback?.(response)
        }
      })
    },
    lobbyJoin: (lobbyId, callback) => {
      request<LobbyJoin>({ route: "lobby/join", type: "request", id: randomHash(), join: lobbyId }, (response) => {
        if ("error" in response) {
          console.error("failed to join lobby:", response.error)
        } else {
          client.lobbyId = lobbyId
          callback(response)
          world.addSystemBuilders([NetClientReadSystem, NetClientWriteSystem])
        }
      })
    },
    lobbyLeave: () => {
      request<LobbyExit>({ route: "lobby/exit", type: "request", id: randomHash() }, (response) => {
        if ("error" in response) {
          console.error("failed to leave lobby:", response.error)
        } else {
          client.lobbyId = undefined

          world.removeSystem(NetClientReadSystem.id)
          world.removeSystem(NetClientWriteSystem.id)

          const players = world.players()
          for (const player of players) {
            if (player.id === client.player.id) continue

            world.removeEntity(player.id)
          }
        }
      })
    },
    lobbyList: (callback) => {
      request<LobbyList>({ route: "lobby/list", type: "request", id: randomHash() }, (response) => {
        if ("error" in response) {
          console.error("failed to get lobby list:", response.error)
        } else {
          callback(response)
        }
      })
    },
    metaPlayers: (callback) => {
      request<MetaPlayers>({ route: "meta/players", type: "request", id: randomHash() }, (response) => {
        if ("error" in response) {
          console.error("failed to get meta players:", response.error)
        } else {
          callback(response)
        }
      })
    },
    authLogin: async (jwt, callback) => {
      request<AuthLogin>({ route: "auth/login", type: "request", id: randomHash(), jwt }, (response) => {
        if ("error" in response) {
          console.error("failed to login:", response.error)
        } else {
          client.token = response.token

          localStorage?.setItem("token", response.token)
          if (!response.newUser) client.profileGet()
          if (callback) callback(response)
        }
      })
    },
    logout: () => {
      localStorage?.removeItem("token")
      window.location.reload()
    },
    aiPls: (prompt, callback) => {
      request<Pls>({ route: "ai/pls", type: "request", id: randomHash(), prompt }, (response) => {
        if ("error" in response) {
          console.error("failed to get AI response:", response.error)
        } else {
          callback(response)
        }
      })
    },
    profileCreate: (name, callback) => {
      if (!client.token) return
      request<ProfileCreate>({ route: "profile/create", type: "request", id: randomHash(), token: client.token, name }, (response) => {
        if ("error" in response) {
          console.error("failed to create profile:", response.error)
        } else {
          client.profileGet()
          callback(response)
        }
      })
    },
    profileGet: (callback) => {
      if (!client.token) return
      request<ProfileGet>({ route: "profile/get", type: "request", id: randomHash(), token: client.token }, (response) => {
        if ("error" in response) {
          console.error("failed to get profile:", response.error)
          client.token = undefined
          if (localStorage) localStorage.removeItem("token")
        } else {
          client.player.components.pc.data.name = response.name
          if (callback) callback(response)
        }
      })
    },
    friendsAdd: (name, callback) => {
      if (!client.token) return
      request<FriendsAdd>({ route: "friends/add", type: "request", id: randomHash(), token: client.token, name }, (response) => {
        if ("error" in response) {
          console.error("failed to add friend:", response.error)
        } else {
          callback(response)
        }
      })
    },
    friendsList: (callback) => {
      if (!client.token) return
      request<FriendsList>({ route: "friends/list", type: "request", id: randomHash(), token: client.token }, (response) => {
        if ("error" in response) {
          console.error("failed to get friends list:", response.error)
        } else {
          callback(response)
        }
      })
    }
  }

  setInterval(() => {
    client.net.synced = Boolean(client.lastMessageTick && ((world.tick - client.lastMessageTick) < 60))
  }, 200)

  const setupWs = () => {
    client.ws.binaryType = "arraybuffer"

    client.ws.addEventListener("close", () => {
      console.error("websocket closed")
      world.removeSystem(NetClientReadSystem.id)
      world.removeSystem(NetClientWriteSystem.id)
    })

    client.ws.addEventListener("message", (event) => {
      try {
        const message = decode(new Uint8Array(event.data)) as NetMessageTypes

        if (message.type !== "response") return

        if (message.data.id in requestBuffer) {
          const callback = requestBuffer[message.data.id]

          callback(message.data)
          delete requestBuffer[message.data.id]
        }
      } catch (error) {
        console.error("failed to parse message", error)
      }
    })

    client.ws.onopen = () => {
      console.log("connected to server")
      client.net.connected = true

      if (localStorage) {
        const token = localStorage.getItem("token")
        if (token) {
          client.token = token
          client.profileGet()
        }
      }
    }

    client.ws.onclose = () => {
      console.error("disconnected from server")
      client.net.connected = false

      setTimeout(() => {
        console.log("reconnecting to server")
        client.ws = new WebSocket(servers[env])
        setupWs()
      }, 2000)
    }
  }

  setupWs()

  return client
}
