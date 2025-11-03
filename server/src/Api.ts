import {
  ExtractedRequestTypes, Friend, NetMessageTypes, RequestTypes, ResponseData,
  entries, randomHash, keys, round, stringify, values, BadResponse, GameTitle,
  CORSHeaders, ValidOrigins, WSRequestTypes, HttpError, HttpOk, DiscordDomain, DiscordCookie
} from "@piggo-gg/core"
import { ServerWorld, PrismaClient } from "@piggo-gg/server"
import { Server, ServerWebSocket, env } from "bun"
import jwt from "jsonwebtoken"
import { decode, encode } from "@msgpack/msgpack"
import { OAuth2Client } from "google-auth-library"

export type PerClientData = {
  id: number
  ip: string | null
  playerId: string
  playerName?: string
  worldId: string
}

type SessionToken = { googleId: string }

type Handler<R extends RequestTypes["route"]> = (_: { ws: ServerWebSocket<PerClientData>, data: ExtractedRequestTypes<R> }) =>
  Promise<ExtractedRequestTypes<R>["response"] | BadResponse>

export type Api = {
  bun: Server | undefined
  http: Server | undefined
  clientIncr: number
  clients: Record<string, ServerWebSocket<PerClientData>>
  worlds: Record<string, ServerWorld>
  handlers: { [R in WSRequestTypes["route"]]: Handler<R> }
  init: () => Api
  handleClose: (ws: ServerWebSocket<PerClientData>) => void
  handleOpen: (ws: ServerWebSocket<PerClientData>) => void
  handleMessage: (ws: ServerWebSocket<PerClientData>, data: Buffer) => void
}

export const Api = (): Api => {

  const prisma = new PrismaClient()
  const JWT_SECRET = process.env["JWT_SECRET"] ?? "piggo"
  const DISCORD_SECRET = process.env["DISCORD_SECRET"] ?? ""
  const google = new OAuth2Client("1064669120093-9727dqiidriqmrn0tlpr5j37oefqdam3.apps.googleusercontent.com")

  const skiplog: RequestTypes["route"][] = ["meta/players", "auth/login", "lobby/list"]

  const verifyJWT = (data: { token: string }): SessionToken | false => {
    let token: SessionToken | undefined = undefined
    try {
      token = jwt.verify(data.token, JWT_SECRET) as SessionToken
      if (token) return token
    } catch (e) {
      console.error("JWT verification failed:", (e as Error).message)
    }
    return false
  }

  const api: Api = {
    bun: undefined,
    http: undefined,
    clientIncr: 1,
    clients: {},
    worlds: {},
    handlers: {
      "lobby/list": async ({ data }) => {
        const lobbies: Record<string, { id: string, players: number, creator: string, game: GameTitle }> = {}
        for (const [id, world] of entries(api.worlds)) {
          if (world.numClients() === 0) continue
          lobbies[id] = {
            id,
            players: keys(world.clients).length,
            creator: world.creator.data.playerName ?? "noob",
            game: world.world.game.id
          }
        }
        return { id: data.id, lobbies }
      },
      "lobby/create": async ({ ws, data }) => {
        const lobbyId = data.lobbyId || randomHash()

        if (data.playerName) {
          ws.data.playerName = data.playerName
        }

        // join if it already exists
        if (api.worlds[lobbyId]) {
          ws.data.worldId = lobbyId
          return { id: data.id, lobbyId }
        }

        // create world
        api.worlds[lobbyId] = ServerWorld({ creator: ws, game: data.game })

        // set world id for this client
        ws.data.worldId = lobbyId

        return { id: data.id, lobbyId }
      },
      "lobby/join": async ({ ws, data }) => {
        if (!api.worlds[data.join]) {
          return { id: data.id, error: "world not found" }
        }

        ws.data.worldId = data.join
        return { id: data.id }
      },
      "lobby/exit": async ({ data, ws }) => {
        const world = api.worlds[ws.data.worldId]
        if (world) {
          world.handleClose(ws)
          ws.data.worldId = ""
        } else {
          return { id: data.id, error: "world not found" }
        }
        return { id: data.id }
      },
      "meta/players": async ({ data }) => {
        return { id: data.id, online: keys(api.clients).length }
      },
      "friends/add": async ({ ws, data }) => {
        const token = verifyJWT(data)
        if (!token) return { id: data.id, error: "auth failed" }

        if (ws.data.playerName === data.name) {
          return { id: data.id, error: "that's you, silly" }
        }

        const user = await prisma.users.findUnique({ where: { name: data.name } })
        if (!user) return { id: data.id, error: "user not found" }

        const friend = await prisma.friends.findFirst({
          where: {
            user1: { googleId: token.googleId },
            user2Id: data.name
          }
        })

        if (friend) {
          if (friend.status === "ACCEPTED") {
            return { id: data.id, error: "already friends" }
          }
          if (friend.status === "PENDING") {
            return { id: data.id, error: "friend request already sent" }
          }
          if (friend.status === "BLOCKED") {
            return { id: data.id, error: "user blocked" }
          }
        } else {
          await prisma.friends.create({
            data: {
              user1: { connect: { googleId: token.googleId } },
              user2: { connect: { name: data.name } },
              status: "PENDING"
            }
          })
        }

        return { id: data.id }
      },
      "friends/list": async ({ data }) => {
        let result: { id: string, friends: Record<string, Friend> } = { friends: {}, id: data.id }

        let token: SessionToken | undefined = undefined

        try {
          token = jwt.verify(data.token, JWT_SECRET) as SessionToken
        } catch (e) {
          return { id: data.id, error: "auth failed" }
        }

        const user = await prisma.users.findUnique({ where: { googleId: token.googleId } })
        if (!user) return { id: data.id, error: "user not found" }

        const friends = await prisma.friends.findMany({
          where: { user1: user, NOT: { status: "BLOCKED" } },
          include: { user2: true }
        })

        for (const { user2, status } of friends) {
          const online = Boolean(values(api.clients).find((client) => {
            return client.data.playerName === user2.name
          }))
          result.friends[user2.name] = { name: user2.name, online, status }
        }

        return result
      },
      "friends/remove": async ({ data }) => {
        return { id: data.id }
      },
      "profile/get": async ({ ws, data }) => {
        const token = verifyJWT(data)
        if (!token) return { id: data.id, error: "auth failed" }

        // 2. find user
        const user = await prisma.users.findUnique({ where: { googleId: token.googleId } })
        if (!user) return { id: data.id, error: "user not found" }

        // 3. update websocket playerName
        ws.data.playerName = user.name

        // 4. update player entity name
        const pc = api.worlds[ws.data.worldId]?.world.entity(ws.data.playerId)?.components.pc
        if (pc) pc.data.name = user.name

        return { id: data.id, name: user.name }
      },
      "profile/create": async ({ data }) => {
        let token: SessionToken | undefined = undefined

        // 1. verify jwt
        try {
          token = jwt.verify(data.token, JWT_SECRET) as SessionToken
        } catch (e) {
          return { id: data.id, error: "auth failed" }
        }

        // 2. check if username is taken
        const oldUser = await prisma.users.findUnique({ where: { name: data.name } })
        if (oldUser) return { id: data.id, error: "username already taken" }

        // 3. create user
        const newUser = await prisma.users.create({
          data: { name: data.name, googleId: token.googleId }
        })

        return { id: data.id, name: newUser.name }
      },
      "auth/login": async ({ ws, data }) => {

        // 1. verify google jwt
        const ticket = await google.verifyIdToken({
          idToken: data.jwt,
          audience: "1064669120093-9727dqiidriqmrn0tlpr5j37oefqdam3.apps.googleusercontent.com"
        })

        const { sub } = ticket.getPayload() ?? {}

        if (!sub) {
          return { id: data.id, error: "google Auth failed" }
        }

        let newUser = false

        // 2. set state if user exists
        let user = await prisma.users.findUnique({ where: { googleId: sub } })
        if (user) {
          ws.data.playerName = user.name
          const pc = api.worlds[ws.data.worldId]?.world.entity(ws.data.playerId)?.components.pc
          if (pc) pc.data.name = user.name
        } else {
          newUser = true
        }

        // 3. create session token
        const token = jwt.sign({ googleId: sub }, JWT_SECRET, { expiresIn: "8h" })

        return { id: data.id, token, newUser }
      },
      "ai/pls": async ({ data }) => {
        // const response = await gptPrompt(data.prompt)
        return { id: data.id, response: [] }
      }
    },
    init: () => {
      api.bun = Bun.serve({
        hostname: "0.0.0.0",
        port: env.PORT ?? 3000,
        fetch: async (r: Request, server: Server) => {
          let origin = r.headers.get("origin")

          // sometimes origin is null from discord
          const referer = r.headers.get("referer")
          if (origin === null && referer?.includes(DiscordDomain)) {
            origin = `https://${DiscordDomain}`
          }

          // check valid origin
          if (!origin || !ValidOrigins.includes(origin)) {
            console.log("blocked origin:", origin)
            return HttpError(403, "invalid origin", origin ?? "")
          }

          // CORS
          if (r.method === "OPTIONS") return HttpOk(origin)

          const cookie = r.headers.get("cookie")

          const url = new URL(r.url)

          // discord cookie
          if (url.pathname === "/discord/me") {
            if (!cookie) return HttpError(400, "missing cookie", origin)

            const match = cookie.match(/access_token=([^;]+)/)
            if (!match) return HttpError(400, "missing access_token", origin)

            const access_token = match[1]

            const response = await fetch('https://discord.com/api/users/@me', {
              headers: {
                ...CORSHeaders(origin),
                Authorization: `Bearer ${access_token}`
              }
            })

            if (response.status !== 200) {
              return HttpError(401, "failed to fetch discord me", origin)
            }

            const data = await response.json() as { username: string }

            return HttpOk(origin, { ...data, access_token })
          }

          // discord login
          if (url.pathname === "/discord/login") {
            const code = url.searchParams.get("code")

            if (!code) {
              return HttpError(400, "missing code", origin)
            }

            const response = await fetch('https://discord.com/api/oauth2/token', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              body: new URLSearchParams({
                code,
                client_id: "1433003541521236100",
                client_secret: DISCORD_SECRET,
                grant_type: 'authorization_code'
              })
            })

            const { access_token } = await response.json() as { access_token: string }

            return HttpOk(origin, { access_token }, { "Set-Cookie": DiscordCookie(access_token) })
          }

          // websocket upgrade
          return server.upgrade(r, { data: { ip: r.headers.get("x-forwarded-for") } }) ?
            new Response() :
            new Response("upgrade failed", { status: 500 })
        },
        websocket: {
          perMessageDeflate: false,
          close: api.handleClose,
          open: api.handleOpen,
          message: api.handleMessage
        }
      })

      if (env.NODE_ENV === "staging") api.http = Bun.serve({
        hostname: "0.0.0.0",
        port: 8000,
        fetch: async (req: Request) => {
          const url = new URL(req.url)

          if (url.pathname === "/") url.pathname = "/index.html"

          const path = "../docs" + url.pathname

          const file = Bun.file(path)
          const exists = await file.exists()
          if (exists) {
            const fileContent = await file.bytes()
            const contentType = file.type

            return new Response(fileContent, { headers: { 'Content-Type': contentType } })
          } else {
            console.error("404", path)
            return new Response("file not found", { status: 404 })
          }
        }
      })

      return api
    },
    handleClose: (ws: ServerWebSocket<PerClientData>) => {
      const world = api.worlds[ws.data.worldId]
      if (world) world.handleClose(ws)

      if (ws.data.ip) console.log("client disconnected", ws.data.ip)

      delete api.clients[ws.data.id]
    },
    handleOpen: (ws: ServerWebSocket<PerClientData>) => {
      // set data for this client
      ws.data = { id: api.clientIncr, worldId: "", playerName: "noob", playerId: "", ip: ws.data.ip }

      if (ws.data.ip) console.log("client connected", ws.data.ip)

      // add client to clients
      api.clients[ws.data.id] = ws

      // increment id
      api.clientIncr += 1
    },
    handleMessage: (ws: ServerWebSocket<PerClientData>, data: Buffer) => {
      const wsData = decode(data) as NetMessageTypes
      if (!wsData.type) return

      if (wsData.type === "request") {
        const handler = api.handlers[wsData.data.route]

        if (handler) {
          if (!skiplog.includes(wsData.data.route)) {
            // @ts-expect-error
            const { token, type, ...loggable } = wsData.data
            console.log("<<", ws.data.playerName, stringify(loggable))
          }

          const start = performance.now()

          handler({ ws, data: wsData.data }).then((data) => {
            if (!skiplog.includes(wsData.data.route)) {
              console.log(">>", ws.data.playerName, stringify({ route: wsData.data.route, ...data }), `ms:${round(performance.now() - start)}`)
            }
            const responseData: ResponseData = { type: "response", data }
            ws.send(encode(responseData))
          })
        }
        return
      }

      const world = api.worlds[ws.data.worldId]
      if (world) world.handleMessage(ws, wsData)
    }
  }

  setInterval(() => {
    for (const [id, world] of entries(api.worlds)) {

      // clean up empty worlds
      if (keys(world.clients).length === 0) {
        delete api.worlds[id]
      }
    }
  }, 2000)

  return api
}

const server = Api().init()
console.log(`包 ${server.bun?.url}`)
console.log(server.http ? `包子 ${server.http?.url}` : "http server not started")
