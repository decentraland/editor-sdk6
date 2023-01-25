import * as vscode from 'vscode'
import { loader } from '../modules/loader'
import { setLocalValue } from '../modules/storage'
import { getMessage } from '../modules/error'
import { createWebview } from '../views/publish-scene/webview'
import {
  getSceneLink,
  handleDeploymentError,
  validateWorldConfiguration,
} from '../views/publish-scene/utils'
import { publishSceneServer } from '../views/publish-scene/server'

export async function deploy(args: string = '', isWorld = false) {
  // Set world flag
  setLocalValue('isWorld', isWorld)

  // If it's a world, make sure the configuration is valid
  if (isWorld) {
    validateWorldConfiguration()
  }

  // Create the webview
  const webview = createWebview()

  // Start the server
  publishSceneServer.start(...args.split(' '))

  // Listen for the user closing the webview
  let didDispose
  webview.onDispose(() => {
    didDispose = true
    publishSceneServer.stop()
  })

  // Open publish screen
  try {
    await loader('Opening publish screen...', () =>
      Promise.race([webview.load(), publishSceneServer.waitForPublish()])
    )
  } catch (error) {
    publishSceneServer.stop()
    if (!didDispose) {
      throw new Error('Something went wrong opening publish screen')
    }
    return
  }

  try {
    // Wait for user to publish
    const success = await publishSceneServer.waitForPublish()

    // Close view
    webview.dispose()

    // If successful show jump in notification
    if (success) {
      const jumpIn = await vscode.window.showInformationMessage(
        'Scene published successfully!',
        'Jump In'
      )
      if (jumpIn) {
        vscode.env.openExternal(vscode.Uri.parse(getSceneLink(isWorld)))
      }
    }
    // Not successful is ignored, it means the process was killed gracefuly without getting to deploy, if an actual error ocurred it would throw and be handled by the catch block
  } catch (error) {
    // Something went wrong, kill server and show error
    await publishSceneServer.stop()
    handleDeploymentError(getMessage(error))
  }
}
