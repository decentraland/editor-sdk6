import * as vscode from 'vscode'
import { GLTFPreviewEditorProvider } from './gltf-preview/provider'

export function activate(context: vscode.ExtensionContext) {
  // Register custom editor
  context.subscriptions.push(GLTFPreviewEditorProvider.register(context))
}
