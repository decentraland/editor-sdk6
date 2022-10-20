import * as vscode from 'vscode'
import path from 'path'
import { getExtensionPath } from '../utils/path'
import { getNonce } from '../utils/webviews'
import { loader } from '../utils/loader'
import { getServerUrl, ServerName, waitForServer } from '../utils/port'
import { run } from '../utils/run'
import open from 'open'

let started = false

export async function deploy() {
  const url = 'http://localhost:8003'
  if (!started) {
    run('dcl', ['deploy'])
    started = true
    await loader('Opening deployment app', () => waitForServer(url))
  } else {
    await loader('Opening deployment app', () => waitForServer(url))
    open(url)
  }

  // const url = await getServerUrl(ServerName.DCLDeploy)

  // // Webview
  // const panel = vscode.window.createWebviewPanel(
  //   `decentraland.DCLDeploy`,
  //   `Decentraland`,
  //   vscode.ViewColumn.One,
  //   { enableScripts: true, retainContextWhenHidden: true }
  // )

  // // Show loading screen
  // panel.webview.html = getHtml(
  //   panel.webview,
  //   url,
  //   '<div class="loading">Loading&hellip;<div>'
  // )

  // panel.iconPath = vscode.Uri.parse(
  //   path.join(getExtensionPath(), 'media', 'favicon.ico')
  // )

  // // Wait for server to be ready
  // await loader('Opening deployment screen', () =>
  //   waitForServer(ServerName.DCLDeploy)
  // )

  // // Show preview
  // panel.webview.html = getHtml(
  //   panel.webview,
  //   url,
  //   `<iframe
  //     id="dcl-deploy"
  //     src="${url}"
  //     width="100%"
  //     height="100%"
  //     frameBorder="0"
  //   ></iframe>
  // `
  // )
}

function getHtml(webview: vscode.Webview, url: string, content: string) {
  const nonce = getNonce()
  const webviewDirectory = 'src/dcl-preview/webview'

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
