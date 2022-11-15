import { startServer, stopServer } from '../dcl-preview/server'
import { log } from '../utils/log'
import { sleep } from '../utils/sleep'

export async function restart() {
  log(`Restarting DCLPreview server...`)
  stopServer()
  await sleep(1000)
  await startServer()
}
