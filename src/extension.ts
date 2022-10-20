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
import {
  startServer as startDCLDeploy,
  stopServer as stopDCLDeploy,
} from './dcl-deploy/server'
import { getCwd, isDCL, setExtensionPath } from './utils/path'
import { install } from './commands/install'
import { play } from './commands/play'
import { browser } from './commands/browser'
import { uninstall } from './commands/uninstall'
import { deploy } from './commands/deploy'
import { DependenciesProvider } from './dependencies/tree'
import { Dependency } from './dependencies/types'
import { npmInstall, npmUninstall } from './utils/npm'

export async function activate(context: vscode.ExtensionContext) {
  // Set extension path
  setExtensionPath(context.extensionUri.fsPath)

  // Check if it is valid project
  vscode.commands.executeCommand('setContext', 'decentraland.isDCL', isDCL())

  // Dependency tree (UI)
  const dependencies = new DependenciesProvider(getCwd())

  const disposables = [
    // Register GLTF preview custom editor
    GLTFPreviewEditorProvider.register(context),
    // Decentraland Commands
    vscode.commands.registerCommand('decentraland.commands.update', () =>
      npmInstall().then(() => dependencies.refresh())
    ),
    vscode.commands.registerCommand('decentraland.commands.install', () =>
      install().then(() => dependencies.refresh())
    ),
    vscode.commands.registerCommand('decentraland.commands.uninstall', () =>
      uninstall().then(() => dependencies.refresh())
    ),
    vscode.commands.registerCommand('decentraland.commands.play', () => play()),
    vscode.commands.registerCommand('decentraland.commands.deploy', () =>
      deploy()
    ),
    vscode.commands.registerCommand('decentraland.commands.browser', () =>
      browser()
    ),
    // Dependencies
    vscode.window.registerTreeDataProvider('dependencies', dependencies),
    vscode.commands.registerCommand(
      'dependencies.commands.delete',
      (node: Dependency) =>
        npmUninstall(node.label).then(() => dependencies.refresh())
    ),
  ]

  // push all disposables into subscriptions
  for (const disposable of disposables) {
    context.subscriptions.push(disposable)
  }

  // Start webservers
  await Promise.all([startGLTFPreview(), startDCLPreview()])
}

export async function deactivate() {
  // Stop  webservers
  await Promise.all([stopGLTFPreview(), stopDCLPreview(), stopDCLDeploy()])
}
