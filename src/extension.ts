import * as vscode from 'vscode'
import { WearablePreviewEditorProvider } from './provider'

export function activate(context: vscode.ExtensionContext) {
  // Register custom editor
  context.subscriptions.push(WearablePreviewEditorProvider.register(context))
}
