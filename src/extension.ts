import * as vscode from 'vscode'
import { spawn } from 'child_process' // use cross-spawn?
import { GLTFPreviewEditorProvider } from './gltf-preview/provider'
import { start, stop } from './gltf-preview/server'
import future from 'fp-future'
import path from 'path'
import { setExtensionPath } from './utils/get-extension-path'
import { install } from './commands/install'

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

  // Start gltf-preview webserver
  await start()
}

export async function deactivate() {
  // Stop gltf-preview webserver
  await stop()
}
