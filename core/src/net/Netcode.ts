import { InvokedAction, SerializedEntity, World } from "@piggo-gg/core"

// netcode

export type Syncer = {
  read: (_: { world: World, buffer: GameData[] }) => void
  write: (world: World) => GameData
}

export type NetMessageTypes = GameData | RequestData | ResponseData

export type GameData = {
  type: "game"
  actions: Record<number, Record<string, InvokedAction[]>>
  chats: Record<string, string[]>
  game: string
  playerId: string
  serializedEntities: Record<string, SerializedEntity>
  tick: number
  timestamp: number
  latency?: number
  diff?: number
}

// API

export type BadResponse = { id: string, error: string }
export type GoodResponse<R> = R & { id: string, success: true }

export type Request<Route, Response extends {} = {}> = {
  type: "request"
  id: string
  route: Route
  response: GoodResponse<Response>
}

export type Route = RequestTypes["route"]

export type RequestTypes =
  LobbyList | LobbyCreate | LobbyJoin | LobbyExit |
  FriendsList | FriendsAdd | FriendsRemove |
  ProfileCreate | ProfileGet |
  AuthLogin |
  Pls |
  MetaPlayers

export type ExtractedRequestTypes<T extends RequestTypes['route']> = Extract<RequestTypes, { route: T }>

export type RequestData = {
  type: "request"
  data: Omit<RequestTypes, "response">
}

export type ResponseData = {
  type: "response"
  data: RequestTypes["response"] | BadResponse
}

// lobby endpoints
export type LobbyList = Request<"lobby/list", { lobbies: Record<string, { id: string, name: string, players: number }> }>
export type LobbyCreate = Request<"lobby/create", { lobbyId: string }>
export type LobbyJoin = Request<"lobby/join"> & { join: string }
export type LobbyExit = Request<"lobby/exit">

export type LobbyListRequest = Omit<LobbyList, "response">
export type LobbyCreateRequest = Omit<LobbyCreate, "response">
export type LobbyJoinRequest = Omit<LobbyJoin, "response">
export type LobbyExitRequest = Omit<LobbyExit, "response">

// friends endpoints
export type Friend = { name: string, online: boolean, status: "ACCEPTED" | "PENDING" | "BLOCKED" }
export type FriendsAdd = Request<"friends/add"> & { name: string, token: string }
export type FriendsList = Request<"friends/list", { friends: Record<string, Friend> }> & { token: string }
export type FriendsRemove = Request<"friends/remove"> & { removeUserId: string }

// profile endpoints
export type ProfileCreate = Request<"profile/create", { name: string }> & { token: string, name: string }
export type ProfileGet = Request<"profile/get", { name: string }> & { token: string }

// auth endpoints
export type AuthLogin = Request<"auth/login", { token: string, newUser: boolean }> & {
  jwt: string
}

// ai endpoints
export type Pls = Request<"ai/pls", { response: string[] }> & { prompt: string }

// meta endpoints
export type MetaPlayers = Request<"meta/players", { online: number }>
