import vscode from 'vscode'
import path from 'path'
import { getExtensionPath } from '../../modules/path'
import { Webview } from '../../modules/webview'
import { ServerName } from '../../types'
import { getServerUrl } from '../../utils'

export async function createWebview() {
  // Webview
  const panel = vscode.window.createWebviewPanel(
    `decentraland.PublishScene`,
    `Decentraland`,
    vscode.ViewColumn.One,
    { enableScripts: true, retainContextWhenHidden: true }
  )

  panel.iconPath = vscode.Uri.file(
    path.join(getExtensionPath(), 'resources', 'logo.ico')
  )

  const url = await getServerUrl(ServerName.PublishScene)
  const webview = new Webview(url, panel)

  return webview
}
