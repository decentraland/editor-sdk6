import path from 'path'
import vscode from 'vscode'
import { getExtensionPath } from '../../modules/path'
import { Webview } from '../../modules/webview'
import { ServerName } from '../../types'
import { getServerUrl } from '../../utils'

export async function createWebview() {
  const panel = vscode.window.createWebviewPanel(
    `decentraland.Inspector`,
    `Decentraland`,
    vscode.ViewColumn.Three,
    { enableScripts: true, retainContextWhenHidden: true }
  )

  panel.iconPath = vscode.Uri.file(
    path.join(getExtensionPath(), 'resources', 'logo.ico')
  )

  const url = await getServerUrl(ServerName.Inspector)

  const webview = new Webview(url, panel)

  return webview
}
