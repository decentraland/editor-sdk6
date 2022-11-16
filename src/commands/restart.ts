import { startServer, stopServer } from '../dcl-preview/server'

export async function restart() {
  await stopServer()
  await startServer()
}
