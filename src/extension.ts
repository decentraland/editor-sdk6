import * as vscode from 'vscode'
import { GLTFPreviewEditorProvider } from './gltf-preview/provider'
import {
  startServer as startGLTFPreview,
  stopServer as stopGLTFPreview,
} from './gltf-preview/server'
import {
  startServer as startDCLPreview,
  stopServer as stopDCLPreview,
} from './dcl-preview/server'
import { setExtensionPath } from './utils/path'
import { install } from './commands/install'
import { start } from './commands/start'
import { browser } from './commands/browser'

export async function activate(context: vscode.ExtensionContext) {
  // Set extension path
  setExtensionPath(context.extensionUri.fsPath)

  // Register custom editor
  const gltfPreviewDiposable = GLTFPreviewEditorProvider.register(context)
  context.subscriptions.push(gltfPreviewDiposable)

  // Register commands
  const installDisposable = vscode.commands.registerCommand(
    'decentraland.commands.install',
    () => install()
  )
  context.subscriptions.push(installDisposable)
  const startDisposable = vscode.commands.registerCommand(
    'decentraland.commands.start',
    () => start()
  )
  context.subscriptions.push(startDisposable)

  const browserDisposable = vscode.commands.registerCommand(
    'decentraland.commands.browser',
    () => browser()
  )
  context.subscriptions.push(browserDisposable)

  // Start webservers
  await Promise.all([startGLTFPreview(), startDCLPreview()])
}

export async function deactivate() {
  // Stop  webservers
  await Promise.all([stopGLTFPreview(), stopDCLPreview()])
}
