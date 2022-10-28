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
import { start } from './commands/start'
import { browser } from './commands/browser'
import { uninstall } from './commands/uninstall'
import { deploy } from './commands/deploy'
import { DependenciesProvider } from './dependencies/tree'
import { init } from './commands/init'
import { Dependency } from './dependencies/types'
import { npmInstall, npmUninstall } from './utils/npm'
import { ServerName } from './utils/port'

export async function activate(context: vscode.ExtensionContext) {
  // Set extension path
  setExtensionPath(context.extensionUri.fsPath)

  // Dependency tree (UI)
  const dependencies = new DependenciesProvider(getCwd())

  const disposables = [
    // Register GLTF preview custom editor
    GLTFPreviewEditorProvider.register(context),
    // Decentraland Commands
    vscode.commands.registerCommand('decentraland.commands.init', () =>
      init().then(() => validate())
    ),
    vscode.commands.registerCommand('decentraland.commands.update', () =>
      npmInstall().then(() => dependencies.refresh())
    ),
    vscode.commands.registerCommand('decentraland.commands.install', () =>
      install().then(() => dependencies.refresh())
    ),
    vscode.commands.registerCommand('decentraland.commands.uninstall', () =>
      uninstall().then(() => dependencies.refresh())
    ),
    vscode.commands.registerCommand('decentraland.commands.start', () =>
      start()
    ),
    vscode.commands.registerCommand('decentraland.commands.deploy', () =>
      deploy()
    ),
    vscode.commands.registerCommand(
      'decentraland.commands.deployCustom',
      async () =>
        deploy(
          `--target ${await vscode.window.showInputBox({
            title: 'Deploy to custom Catalyst',
            prompt: 'Enter the URL of the Catalyst',
            placeHolder: 'peer-testing.decentraland.org',
          })}`
        )
    ),
    vscode.commands.registerCommand('decentraland.commands.browser.run', () =>
      browser(ServerName.DCLPreview)
    ),
    vscode.commands.registerCommand(
      'decentraland.commands.browser.deploy',
      () => browser(ServerName.DCLDeploy)
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

  // Validate the project folder
  await validate()
}

export async function deactivate() {
  // Stop  webservers
  await Promise.all([stopGLTFPreview(), stopDCLPreview()])
}

export async function validate() {
  // Check if it's a valid project
  const isValid = isDCL()

  // Set in context if it is valid project
  vscode.commands.executeCommand('setContext', 'decentraland.isDCL', isValid)

  // Start webservers
  await (isValid
    ? Promise.all([startGLTFPreview(), startDCLPreview()])
    : startGLTFPreview())
}
