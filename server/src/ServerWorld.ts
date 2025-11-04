import {
  DefaultWorld, entries, GameData, GameTitle, keys, NetMessageTypes, NetServerSystem, Player, World
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
  const lastMessageTick: Record<string, number> = {}

  world.addSystems([NetServerSystem({
    world, clients, latestClientMessages, latestClientLag, latestClientDiff, lastMessageTick }
  )])
  world.addSystemBuilders([NoobSystem])

  // clean up idle players
  // setInterval(() => {
  //   for (const [clientId, ws] of entries(clients)) {
  //     const latestTick = lastMessageTick[clientId] || 0
  //     if (world.tick - latestTick > 80) {
  //       world.removeEntity(clientId)

  //       delete clients[clientId]
  //       delete latestClientMessages[clientId]

  //       console.log(`id:${clientId} name:${ws.data.playerName} kicked for inactivity`)
  //     }
  //   }
  // }, 500)

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

      const diff = msg.tick - world.tick
      if (diff > 40) console.log(`diff: ${diff}`)

      // add player entity if it doesn't exist
      if (!world.entities[msg.playerId]) {
        ws.data.playerId = msg.playerId

        const leader = world.players().length === 0
        world.addEntity(Player({ id: msg.playerId, name: ws.data.playerName, leader }))

        clients[msg.playerId] = ws
        latestClientMessages[msg.playerId] = []

        console.log(`id:${ws.data.playerId} name:${ws.data.playerName} connected ${ws.remoteAddress}`)
      }

      // store the message
      latestClientMessages[msg.playerId].push(msg)

      // record latency
      if (!lastMessageTick[msg.playerId] || lastMessageTick[msg.playerId] < msg.tick) {
        latestClientLag[msg.playerId] = Date.now() - msg.timestamp

        // const diff = msg.tick - world.tick
        latestClientDiff[msg.playerId] = diff

        if (diff < 1 || world.tick % 200 === 0) {
          console.log(`diff:${diff} lag:${latestClientLag[msg.playerId]}ms player:${ws.data.playerId} name:${ws.data.playerName}`)
        }
      }
    }
  }
}
