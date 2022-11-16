import path from 'path'
import express from 'express'
import { Server } from 'http'
import future from 'fp-future'
import { clearPort, getPort, ServerName } from '../utils/port'

const app = express()
const dir = path.join(
  __dirname,
  '../../node_modules/@dcl/wearable-preview/static-local'
)

app.use(express.static(dir))

let server: Server | null = null

export async function startServer() {
  if (server) {
    await stopServer()
  }
  const port = await getPort(ServerName.GTLFPreview)
  const promise = future<void>()
  server = app.listen(port, () => {
    console.info(`GLTFPreview: http server assigned port is ${port}`)
    promise.resolve()
  })

  return promise
}

export async function stopServer() {
  if (server) {
    server.close()
  }
  server = null
  clearPort(ServerName.GTLFPreview)
  console.info(`GLTFPreview: http server closed`)
}
