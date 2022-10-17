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

  // Start gltf-preview webserver
  await startGLTFPreview()

  // Start dcl-preview webserver
  await startDCLPreview()
}

export async function deactivate() {
  // Stop gltf-preview webserver
  await stopGLTFPreview()

  // Stop dcl-preview webserver
  await startDCLPreview()
}
