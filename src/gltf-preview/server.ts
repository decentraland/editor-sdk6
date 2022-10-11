import path from 'path'
import express from 'express'
import { Server } from 'http'
import future from 'fp-future'
import { clearPort, getPort, ServerName } from '../utils/get-port'

const app = express()
const dir = path.join(
  __dirname,
  '../../node_modules/@dcl/wearable-preview/static-local'
)

app.use(express.static(dir))

let server: Server | null = null

export async function start() {
  if (server) {
    stop()
  }
  const port = await getPort(ServerName.GTLFPreview)
  const promise = future<void>()
  server = app.listen(port, () => {
    console.info(`GLTFPreview: http server listening on port ${port}`)
    promise.resolve()
  })

  return promise
}

export async function stop() {
  if (server) {
    server.close()
  }
  server = null
  clearPort(ServerName.GTLFPreview)
  console.info(`GLTFPreview: http server closed`)
}
