import * as vscode from 'vscode'
import { getExtensionPath } from '../utils/path'
import { getPort, ServerName } from '../utils/port'
import { getNonce } from '../utils/webviews'
import { waitForServer } from '../dcl-preview/server'
import path from 'path'

export async function start() {
  const port = await getPort(ServerName.DCLPreview)

  // Webview
  const panel = vscode.window.createWebviewPanel(
    `decentraland.DCLPreview`,
    `Decentraland Preview`,
    vscode.ViewColumn.One,
    { enableScripts: true, retainContextWhenHidden: true }
  )

  const url = `http://localhost:${port}`

  // Use a nonce to whitelist which scripts can be run

  panel.webview.html = getHtml(panel.webview, url, 'Loading...')

  await waitForServer()

  // Local path to script and css for the webview

  panel.webview.html = getHtml(
    panel.webview,
    url,
    `<iframe 
      id="dcl-preview" 
      src="${url}?position=0%2C0&SCENE_DEBUG_PANEL" 
      width="100%"
      height="100%"
      frameBorder="0"
    ></iframe>
  `
  )
}

function getHtml(webview: vscode.Webview, url: string, content: string) {
  const nonce = getNonce()
  const webviewDirectory = 'src/gltf-preview/webview'

  const scriptUri = webview.asWebviewUri(
    vscode.Uri.file(
      path.join(getExtensionPath(), webviewDirectory, 'script.js')
    )
  )
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
   <script nonce="${nonce}" src="${scriptUri}"></script>
  </body>
  </html>`
}
