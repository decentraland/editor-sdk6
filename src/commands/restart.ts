import { runSceneServer } from '../views/run-scene/server'

export async function restart() {
  await runSceneServer.restart()
}
