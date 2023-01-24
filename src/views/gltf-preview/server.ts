import path from 'path'
import express from 'express'
import { Server } from 'http'
import future from 'fp-future'
import { clearPort, getPort } from '../../modules/port'
import { log } from '../../modules/log'
import { getExtensionPath } from '../../modules/path'
import { ServerName } from '../../modules/server'

const app = express()
let isRouted = false
let server: Server | null = null

export async function startServer() {
  if (!isRouted) {
    const dir = path.join(
      getExtensionPath(),
      './node_modules/@dcl/wearable-preview/static-local'
    )
    app.use(express.static(dir))
    isRouted = true
  }
  await stopServer()
  const port = await getPort(ServerName.GLTFPreview)
  const promise = future<void>()
  server = app.listen(port, () => {
    log(`GLTFPreview: http server assigned port is ${port}`)
    promise.resolve()
  })

  return promise
}

export async function stopServer() {
  if (server) {
    server.close()
    server = null
    clearPort(ServerName.GLTFPreview)
    log(`GLTFPreview: http server closed`)
  }
}
