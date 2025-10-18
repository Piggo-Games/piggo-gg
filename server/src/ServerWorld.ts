import {
  Craft, DefaultWorld, GameData, GameTitle, keys, NetMessageTypes, NetServerSystem, Player, World
} from "@piggo-gg/core"
import { PerClientData, NoobSystem } from "@piggo-gg/server"
import { ServerWebSocket } from "bun"

export type WS = ServerWebSocket<PerClientData>

export type ServerWorld = {
  world: World
  clients: Record<string, WS>
  creator: WS
  numClients: () => number
  handleMessage: (ws: WS, msg: NetMessageTypes) => void
  handleClose: (ws: WS) => void
}

export type ServerWorldProps = {
  clients?: Record<string, WS>
  creator: WS
  game: GameTitle
}

export const ServerWorld = ({ clients = {}, creator, game }: ServerWorldProps): ServerWorld => {

  const world = DefaultWorld({ mode: "server", game })
  const latestClientMessages: Record<string, GameData[]> = {}
  const latestClientLag: Record<string, number> = {}
  const latestClientDiff: Record<string, number> = {}

  world.addSystems([NetServerSystem({ world, clients, latestClientMessages, latestClientLag, latestClientDiff })])
  world.addSystemBuilders([NoobSystem])

  return {
    world,
    clients,
    creator,
    numClients: () => keys(clients).length,
    handleClose: (ws: WS) => {
      world.removeEntity(ws.data.playerId)

      delete clients[ws.data.playerId]
      delete latestClientMessages[ws.data.playerId]

      console.log(`id:${ws.data.playerId} name:${ws.data.playerName} disconnected`)
    },
    handleMessage: (ws: WS, msg: NetMessageTypes) => {
      if (msg.type !== "game") return

      // add player entity if it doesn't exist
      if (!world.entities[msg.playerId]) {
        ws.data.playerId = msg.playerId

        const leader = world.players().length === 0
        world.addEntity(Player({ id: msg.playerId, name: ws.data.playerName, leader }))

        clients[msg.playerId] = ws
        latestClientMessages[msg.playerId] = []

        console.log(`id:${ws.data.playerId} name:${ws.data.playerName} connected ${ws.remoteAddress}`)
      }

      // store last message for client
      latestClientMessages[msg.playerId].push(msg)
      latestClientLag[msg.playerId] = Date.now() - msg.timestamp

      const diff = msg.tick - world.tick
      latestClientDiff[msg.playerId] = diff

      // if (world.tick % 400 === 0) console.log(`player:${ws.data.playerId} name:${ws.data.playerName} diff:${diff}`)
    }
  }
}
