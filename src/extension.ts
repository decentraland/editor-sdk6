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
import { getCwd, isDCL, isEmpty, setExtensionPath, setGlobalStoragePath } from './utils/path'
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
import { ProjectType } from './utils/project'
import { download, resolveVersion, setVersion } from './utils/node'

export async function activate(context: vscode.ExtensionContext) {
  // Set paths
  setExtensionPath(context.extensionUri.fsPath)
  setGlobalStoragePath(context.globalStorageUri.fsPath)

  // Set node binary version
  setVersion(await resolveVersion())

  // Dependency tree (UI)
  let dependencies: DependenciesProvider | null = null
  try {
    dependencies = new DependenciesProvider(getCwd())
  } catch (error) {
    // This will fail if the workbench is in empty state, we just ignore it
  }

  const disposables = [
    // Register GLTF preview custom editor
    GLTFPreviewEditorProvider.register(context),
    // Decentraland Commands
    vscode.commands.registerCommand('decentraland.commands.init', () =>
      init().then(validate)
    ),
    vscode.commands.registerCommand('decentraland.commands.update', () =>
      npmInstall().then(() => dependencies?.refresh())
    ),
    vscode.commands.registerCommand('decentraland.commands.install', () =>
      install().then(() => dependencies?.refresh())
    ),
    vscode.commands.registerCommand('decentraland.commands.uninstall', () =>
      uninstall().then(() => dependencies?.refresh())
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
    dependencies
      ? vscode.window.registerTreeDataProvider('dependencies', dependencies)
      : null,
    vscode.commands.registerCommand(
      'dependencies.commands.delete',
      (node: Dependency) =>
        npmUninstall(node.label).then(() => dependencies?.refresh())
    ),
    // Walkthrough
    vscode.commands.registerCommand('walkthrough.createProject', () =>
      init(ProjectType.SCENE).then(validate)
    ),
    vscode.commands.registerCommand('walkthrough.viewCode', () => {
      vscode.commands.executeCommand(
        'vscode.openFolder',
        vscode.Uri.joinPath(vscode.Uri.parse(getCwd()), 'src', 'game.ts')
      )
    }),
  ]

  // push all disposables into subscriptions
  for (const disposable of disposables) {
    if (disposable) {
      context.subscriptions.push(disposable)
    }
  }

  // Validate the project folder
  await validate()

  // Download node
  await download()
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

  // Set in context if it is an empty folder
  vscode.commands.executeCommand(
    'setContext',
    'decentraland.isEmpty',
    isEmpty()
  )

  // Start webservers
  await (isValid
    ? Promise.all([startGLTFPreview(), startDCLPreview()])
    : startGLTFPreview())
}
