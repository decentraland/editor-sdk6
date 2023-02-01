import { createWebview } from '../views/inspector/webview'

export async function inspector() {
  const webview = await createWebview()
  await webview.load()
}
