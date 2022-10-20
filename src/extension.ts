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
import { getCwd, isDCL, setExtensionPath } from './utils/path'
import { install } from './commands/install'
import { play } from './commands/play'
import { browser } from './commands/browser'
import { update } from './commands/update'
import { uninstall } from './commands/uninstall'
import { deploy } from './commands/deploy'
import { DependenciesProvider } from './dependencies/tree'
import { Dependency } from './dependencies/types'
import { remove } from './commands/remove'

export async function activate(context: vscode.ExtensionContext) {
  // Set extension path
  setExtensionPath(context.extensionUri.fsPath)

  // Check if is valid project
  vscode.commands.executeCommand('setContext', 'decentraland.isDCL', isDCL())

  // Dependency tree
  const dependencies = new DependenciesProvider(getCwd())

  // Register custom editor
  const gltfPreviewDiposable = GLTFPreviewEditorProvider.register(context)
  context.subscriptions.push(gltfPreviewDiposable)

  // Register commands
  const updateDisposable = vscode.commands.registerCommand(
    'decentraland.commands.update',
    () => update().then(() => dependencies.refresh())
  )
  context.subscriptions.push(updateDisposable)
  const installDisposable = vscode.commands.registerCommand(
    'decentraland.commands.install',
    () => install().then(() => dependencies.refresh())
  )
  context.subscriptions.push(installDisposable)
  const uninstallDisposable = vscode.commands.registerCommand(
    'decentraland.commands.uninstall',
    () => uninstall().then(() => dependencies.refresh())
  )
  context.subscriptions.push(uninstallDisposable)
  const playDisposable = vscode.commands.registerCommand(
    'decentraland.commands.play',
    () => play()
  )
  context.subscriptions.push(playDisposable)
  const deployDisposable = vscode.commands.registerCommand(
    'decentraland.commands.deploy',
    () => deploy()
  )
  context.subscriptions.push(deployDisposable)
  const browserDisposable = vscode.commands.registerCommand(
    'decentraland.commands.browser',
    () => browser()
  )
  context.subscriptions.push(browserDisposable)

  const treeDisposable = vscode.window.registerTreeDataProvider(
    'dependencies',
    dependencies
  )
  context.subscriptions.push(treeDisposable)

  const deleteDisposable = vscode.commands.registerCommand(
    'dependencies.commands.delete',
    (node: Dependency) => remove(node.label).then(() => dependencies.refresh())
  )
  context.subscriptions.push(deleteDisposable)

  // Start webservers
  await Promise.all([startGLTFPreview(), startDCLPreview()])
}

export async function deactivate() {
  // Stop  webservers
  await Promise.all([stopGLTFPreview(), stopDCLPreview()])
}
