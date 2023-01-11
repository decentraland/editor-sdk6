import { startServer, stopServer } from '../views/run-scene/server'

export async function restart() {
  await stopServer()
  await startServer()
}
