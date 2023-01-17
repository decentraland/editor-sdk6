import * as vscode from 'vscode'
import path from 'path'
import { getExtensionPath } from '../modules/path'
import { getNonce } from '../modules/webviews'
import { loader } from '../modules/loader'
import {
  getPort,
  getServerParams,
  getServerUrl,
  ServerName,
  waitForServer,
} from '../modules/port'
import { bin } from '../modules/bin'
import { SpanwedChild } from '../modules/spawn'
import { log } from '../modules/log'
import { setLocalValue } from '../modules/storage'
import { getScene } from '../modules/workspace'

let child: SpanwedChild | null = null
let panel: vscode.WebviewPanel | null = null

async function kill() {
  if (child && child.alive()) {
    await child.kill()
    child = null
  }
  if (panel) {
    panel.dispose()
    panel = null
  }
}

export async function deploy(args: string = '', isWorld = false) {
  // kill previous server if open
  kill()

  // Set world flag
  setLocalValue('isWorld', isWorld)

  // Get url for the server
  const url = await getServerUrl(ServerName.PublishScene) + await getServerParams(ServerName.PublishScene)

  // Webview
  panel = vscode.window.createWebviewPanel(
    `decentraland.PublishScene`,
    `Decentraland`,
    vscode.ViewColumn.One,
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

  // start server
  const port = await getPort(ServerName.PublishScene)
  child = bin('decentraland', 'dcl', [
    'deploy',
    `--port ${port}`,
    `--no-browser`,
    args,
  ])

  // This promise resolves when everything is done, or fails on any error
  const deploymentPromise = child.waitFor(/content uploaded/gi, /error/gi)

  // Catch main promise, show error only if server is not up yet (if it fails later there are already try/catchs for that)
  let isLoaded = false
  child.wait().catch((error) => {
    if (!isLoaded) {
      kill()
      throw new Error(error instanceof Error ? error.message : error.toString())
    } else {
      log('PublishScene: main promise failed, but server was already up')
    }
  })

  // Listen for the user closing the webview
  let didDispose = false
  panel.onDidDispose(() => (didDispose = true))

  try {
    await loader('Opening publish screen...', () =>
      Promise.race([waitForServer(url), deploymentPromise])
    )
    if (!child) return
    isLoaded = true
    // Show preview
    panel.webview.html = getHtml(
      panel.webview,
      url,
      `<iframe
      id="dcl-deploy"
      src="${url}"
      width="100%"
      height="100%"
      frameBorder="0"
    ></iframe>
  `
    )
    isLoaded = true
  } catch (error) {
    kill()
    if (!didDispose) {
      throw new Error('Something went wrong opening publish screen')
    }
    return
  }

  try {
    if (!child) return
    await deploymentPromise
    panel.dispose()
    const jumpIn = await vscode.window.showInformationMessage("Scene published successfully!", 'Jump In')
    if (jumpIn) {
      vscode.env.openExternal(vscode.Uri.parse(getSceneLink(isWorld)))
    }
  } catch (error) {
    if (error instanceof Error) {
      handleDeploymentError(error.message)
    } else if (typeof error === 'string') {
      handleDeploymentError(error)
    } else {
      handleDeploymentError('Something went wrong while deploying the scene')
    }
  }
}

function getHtml(webview: vscode.Webview, url: string, content: string) {
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

function getSceneLink(isWorld: boolean) {
  const scene = getScene()
  if (isWorld && scene.worldConfiguration) {
    return `https://play.decentraland.org?realm=${scene.worldConfiguration.name}`
  } else {
    return `https://play.decentraland.org?position=${scene.scene.base}`
  }
}

function handleDeploymentError(error: string) {
  kill()
  if (/address does not have access/gi.test(error)) {
    throw new Error(
      "You don't have permission to publish on the parcels selected"
    )
  } if (/not have permission to deploy under/gi.test(error)) {
    const name = error.match(/under \"((\d|\w|\.)+)\"/)![1]
    throw new Error(
      `You don't have permission to publish under the name "${name}".`
    )
  } else {
    throw new Error(error)
  }
}
