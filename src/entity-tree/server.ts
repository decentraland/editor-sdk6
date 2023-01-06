import { Server } from 'http'
import express from 'express'
import expressWs from 'express-ws'
import future from 'fp-future'
import { clearPort, getPort, ServerName } from '../modules/port'
import { log } from '../modules/log'
import { WebSocket } from 'ws'

const { app } = expressWs(express())

const clients: Set<WebSocket> = new Set()
app.ws('/ws', (ws) => {
  clients.add(ws)
  ws.on('message', function (msg) {
    for (const client of clients) {
      if (client !== ws) {
        client.send(msg)
      }
    }
  })
  ws.on('close', () => {
    clients.delete(ws)
  })
  ws.on('error', (error) => console.error(`WS Error:`, error))
})

let server: Server | null = null

export async function startServer() {
  await stopServer()
  const promise = future<void>()
  const port = await getPort(ServerName.WSTransport)
  server = app.listen(port, () => {
    log(`WSTransport: websocket server assigned port is ${port}`)
    promise.resolve()
  })
  return promise
}

export async function stopServer() {
  if (server) {
    server.close()
    server = null
    clearPort(ServerName.WSTransport)
    log(`WSTransport: websocket server closed`)
  }
}
