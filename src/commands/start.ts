import { loader } from '../modules/loader'
import { createWebivew } from '../views/run-scene/webview'

export async function start() {
  const webview = await createWebivew()
  await loader('Initializing scene...', () => webview.loadOrDispose())
}
