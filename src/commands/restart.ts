import { startServer, stopServer } from '../dcl-preview/server'
import { log } from '../utils/log'
import { sleep } from '../utils/sleep'

export async function restart() {
  await stopServer()
  await startServer()
}
