import * as vscode from 'vscode'
import { spawn } from 'child_process' // use cross-spawn?
import { GLTFPreviewEditorProvider } from './gltf-preview/provider'
import { startServer, stopServer } from './gltf-preview/server'
import future from 'fp-future'
import path from 'path'
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
  await startServer()
}

export async function deactivate() {
  // Stop gltf-preview webserver
  await stopServer()
}
