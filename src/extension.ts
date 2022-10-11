import * as vscode from 'vscode'
import { GLTFPreviewEditorProvider } from './gltf-preview/provider'
import { start, stop } from './gltf-preview/server'

export async function activate(context: vscode.ExtensionContext) {
  // Register custom editor
  context.subscriptions.push(GLTFPreviewEditorProvider.register(context))

  // Start gltf-preview webserver
  await start()
}

export async function deactivate() {
  // Stop gltf-preview webserver
  await stop()
}
