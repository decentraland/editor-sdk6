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
  getCwd,
  isDCL,
  isEmpty,
  setExtensionPath,
  setGlobalStoragePath,
} from './utils/path'
import { install } from './commands/install'
import { start } from './commands/start'
import { browser } from './commands/browser'
import { uninstall } from './commands/uninstall'
import { deploy } from './commands/deploy'
import { createTree, registerTree } from './dependencies/tree'
import { init } from './commands/init'
import { restart } from './commands/restart'
import { Dependency } from './dependencies/types'
import { npmInstall, npmUninstall } from './utils/npm'
import { getServerParams, getServerUrl, ServerName } from './utils/port'
import { ProjectType } from './utils/project'
import { checkBinaries, resolveVersion, setVersion } from './utils/node'
import { unwatch, watch } from './utils/watch'
import { log } from './utils/log'
import { setContext } from './utils/context'

export async function activate(context: vscode.ExtensionContext) {
  // Set context
  setContext(context)

  // Set paths
  setExtensionPath(context.extensionUri.fsPath)
  setGlobalStoragePath(context.globalStorageUri.fsPath)

  // Validate the project folder is a valid DCL project
  await validate()

  // Set node binary version
  setVersion(await resolveVersion())

  // Create dependency tree
  createTree()

  // Helper ro register a command
  const disposables: vscode.Disposable[] = []
  const register = (command: string, callback: (...args: any[]) => any) =>
    disposables.push(vscode.commands.registerCommand(command, callback))

  // Register GLTF preview custom editor
  GLTFPreviewEditorProvider.register(context, disposables)

  vscode.debug.registerDebugConfigurationProvider(
    'decentraland',
    {
      resolveDebugConfiguration() {
        return null
      },
    },
    vscode.DebugConfigurationProviderTriggerKind.Dynamic
  )

  // Decentraland Commands
  register('decentraland.commands.init', () => init().then(validate))
  register('decentraland.commands.update', () => npmInstall())
  register('decentraland.commands.install', () => install())
  register('decentraland.commands.uninstall', () => uninstall())
  register('decentraland.commands.start', () => start())
  register('decentraland.commands.getDebugURL', async () => `${await getServerUrl(ServerName.DCLPreview)}${await getServerParams(ServerName.DCLPreview)}`)
  register('decentraland.commands.restart', () => restart())
  register('decentraland.commands.deploy', () => deploy())
  register('decentraland.commands.deployCustom', async () =>
    deploy(
      `--target ${await vscode.window.showInputBox({
        title: 'Deploy to custom Catalyst',
        prompt: 'Enter the URL of the Catalyst',
        placeHolder: 'peer-testing.decentraland.org',
      })}`
    )
  )
  register('decentraland.commands.browser.run', () =>
    browser(ServerName.DCLPreview)
  )
  register('decentraland.commands.browser.deploy', () =>
    browser(ServerName.DCLDeploy)
  )

  // Dependencies
  registerTree(disposables)
  register('dependencies.commands.delete', (node: Dependency) =>
    npmUninstall(node.label)
  )
  register('dependencies.commands.update', (node: Dependency) =>
    npmInstall(`${node.label}@latest`)
  )

  // Walkthrough
  register('walkthrough.createProject', () =>
    init(ProjectType.SCENE).then(validate)
  )
  register('walkthrough.viewCode', () => {
    vscode.commands.executeCommand(
      'vscode.openFolder',
      vscode.Uri.joinPath(vscode.Uri.parse(getCwd()), 'src', 'game.ts')
    )
  })

  // push all disposables into subscriptions
  for (const disposable of disposables) {
    if (disposable) {
      context.subscriptions.push(disposable)
    }
  }

  // Check node binaries, download them if necessary
  await checkBinaries()

  // Start servers and watchers
  await boot()
}

export async function deactivate() {
  // Stop watching changes in node_modules
  unwatch()
  // Stop  webservers
  await Promise.all([stopGLTFPreview(), stopDCLPreview()])
}

export async function validate() {
  // Set in context if it is valid project
  vscode.commands.executeCommand('setContext', 'decentraland.isDCL', isDCL())

  // Set in context if it is an empty folder
  vscode.commands.executeCommand(
    'setContext',
    'decentraland.isEmpty',
    isEmpty()
  )
}

async function boot() {
  const isValid = isDCL()
  // Start webservers
  try {
    await (isValid
      ? Promise.all([startGLTFPreview(), startDCLPreview()])
      : startGLTFPreview())
  } catch (error: any) {
    log(`Something went wrong initializing servers:`, error.message)
  }

  // Watch chagnes in node_modules
  if (isValid) {
    watch()
  }
}
