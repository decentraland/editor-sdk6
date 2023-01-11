import * as vscode from 'vscode'
import path from 'path'
import { getExtensionPath } from '../modules/path'
import { getNonce } from '../modules/webviews'
import { loader } from '../modules/loader'
import {
  getServerParams,
  getServerUrl,
  ServerName,
  waitForServer,
} from '../modules/port'

export async function start() {
  const url = await getServerUrl(ServerName.RunScene)

  // Webview
  const panel = vscode.window.createWebviewPanel(
    `decentraland.RunScene`,
    `Decentraland`,
    vscode.ViewColumn.Two,
    { enableScripts: true, retainContextWhenHidden: true }
  )

  // Show loading screen
  panel.webview.html = getHtml(
    panel.webview,
    url,
    '<div class="loading">Loading&hellip;<div>'
  )

  panel.iconPath = vscode.Uri.parse(
    path.join(getExtensionPath(), 'resources', 'logo.ico')
  )

  // Wait for server to be ready
  await loader('Initializing scene...', () => waitForServer(url))

  // Show preview
  panel.webview.html = getHtml(
    panel.webview,
    url,
    `<iframe
      id="run-scene"
      src="${url}${getServerParams(ServerName.RunScene)}"
      width="100%"
      height="100%"
      frameBorder="0"
    ></iframe>
  `
  )
}

export function getHtml(webview: vscode.Webview, url: string, content: string) {
  const nonce = getNonce()
  const webviewDirectory = 'src/views/run-scene/webview'

  const styleUri = webview.asWebviewUri(
    vscode.Uri.file(
      path.join(getExtensionPath(), webviewDirectory, 'style.css')
    )
  )

  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">

    <!--
    Use a content security policy to only allow loading images from https or from our extension directory,
    and only allow scripts that have a specific nonce.
    -->
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; child-src 'self' ${url}; img-src ${webview.cspSource} blob:; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">

    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <link href="${styleUri}" rel="stylesheet" />

    <title>Decentraland Preview</title>
  </head>
  <body>
   ${content}
  </body>
  </html>`
}
