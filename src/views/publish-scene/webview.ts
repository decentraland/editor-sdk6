import vscode from 'vscode'
import path from 'path'
import { getExtensionPath } from '../../modules/path'
import { Webview } from '../../modules/webview'
import { ServerName } from '../../modules/server'

export function createWebview() {
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

  const webview = new Webview(ServerName.PublishScene, panel)

  return webview
}
