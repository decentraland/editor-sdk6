import path from 'path'
import vscode from 'vscode'
import { getExtensionPath } from '../../modules/path'
import { ServerName } from '../../modules/server'
import { Webview } from '../../modules/webview'

export async function createWebivew() {
  const panel = vscode.window.createWebviewPanel(
    `decentraland.RunScene`,
    `Decentraland`,
    vscode.ViewColumn.Two,
    { enableScripts: true, retainContextWhenHidden: true }
  )

  panel.iconPath = vscode.Uri.file(
    path.join(getExtensionPath(), 'resources', 'logo.ico')
  )

  const webview = new Webview(ServerName.RunScene, panel)

  return webview
}
