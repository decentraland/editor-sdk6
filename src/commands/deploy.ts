import * as vscode from 'vscode'
import { loader } from '../modules/loader'
import { bin } from '../modules/bin'
import { SpanwedChild } from '../modules/spawn'
import { log } from '../modules/log'
import { setLocalValue } from '../modules/storage'
import { getScene } from '../modules/workspace'
import { getMessage } from '../modules/error'
import { createWebview } from '../views/publish-scene/webview'

let child: SpanwedChild | null = null

async function kill() {
  if (child && child.alive()) {
    await child.kill()
    child = null
  }
}

export async function deploy(args: string = '', isWorld = false) {
  const webview = createWebview()

  // kill previous server if open
  kill()

  // Set world flag
  setLocalValue('isWorld', isWorld)

  if (isWorld) {
    const scene = getScene()
    if (!scene.worldConfiguration) {
      throw new Error(
        'You need to add a "worldConfiguration" section to your scene.json'
      )
    }
    if (!scene.worldConfiguration.name) {
      throw new Error(
        'You need to add a "name" property to the "worldConfiguration" section in your scene.json'
      )
    }
    if (!scene.worldConfiguration.name.endsWith('.dcl.eth')) {
      throw new Error(
        'The name of your world in your scene.json must end with ".dcl.eth"'
      )
    }
  }

  // start server
  child = bin('decentraland', 'dcl', [
    'deploy',
    `--port ${await webview.getPort()}`,
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
      throw new Error(getMessage(error))
    } else {
      log('PublishScene: main promise failed, but server was already up')
    }
  })

  // Listen for the user closing the webview
  let didDispose = false
  webview.onDispose(() => {
    didDispose = true
  })

  try {
    await loader('Opening publish screen...', () =>
      Promise.race([webview.load(), deploymentPromise])
    )
    if (!child) {
      return
    }
    isLoaded = true
  } catch (error) {
    kill()
    if (!didDispose) {
      throw new Error('Something went wrong opening publish screen')
    }
    return
  }

  try {
    if (!child) {
      return
    }
    await deploymentPromise
    webview.dispose()
    const jumpIn = await vscode.window.showInformationMessage(
      'Scene published successfully!',
      'Jump In'
    )
    if (jumpIn) {
      vscode.env.openExternal(vscode.Uri.parse(getSceneLink(isWorld)))
    }
  } catch (error) {
    handleDeploymentError(getMessage(error))
  }
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
  }
  if (/not have permission to deploy under/gi.test(error)) {
    const name = error.match(/under \"((\d|\w|\.)+)\"/)![1]
    throw new Error(
      `You don't have permission to publish under the name "${name}".`
    )
  } else {
    throw new Error(error)
  }
}
