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
import { isError } from './utils/error'
import { initAnalytics, track } from './utils/analytics'
import { initRollbar, report } from './utils/rollbar'

export async function activate(context: vscode.ExtensionContext) {
  // Set context
  setContext(context)

  // Set paths
  setExtensionPath(context.extensionUri.fsPath)
  setGlobalStoragePath(context.globalStorageUri.fsPath)

  // Validate the project folder is a valid DCL project
  await validate()

  // Initialize analytics
  initAnalytics(context.extensionMode)

  // Initialize error reporting
  initRollbar(context.extensionMode)

  // Set node binary version
  setVersion(await resolveVersion())

  // Create dependency tree
  createTree()

  // Helper ro register a command
  const disposables: vscode.Disposable[] = []
  const registerCommand = (
    command: string,
    callback: (...args: any[]) => any
  ) => {
    const wrapper = async (...args: any[]) => {
      track(`${command}:request`)
      try {
        const result = await callback(...args)
        track(`${command}:success`)
        return result
      } catch (error) {
        if (isError(error)) {
          vscode.window.showErrorMessage(error.message)
          track(`${command}:error`, { message: error.message })
          report(error)
        } else {
          const msg = `Something went wrong running command "${command}"`
          vscode.window.showErrorMessage(msg)
          track(`${command}:error`)
          report(new Error(msg))
        }
      }
    }
    disposables.push(vscode.commands.registerCommand(command, wrapper))
  }

  // Register GLTF preview custom editor
  GLTFPreviewEditorProvider.register(context, disposables)

  // Setup debugger
  vscode.debug.registerDebugConfigurationProvider(
    'decentraland',
    {
      resolveDebugConfiguration() {
        if (!isDCL()) {
          throw new Error(`The current workspace is not a Decentraland project`)
        }
        return null
      },
    },
    vscode.DebugConfigurationProviderTriggerKind.Dynamic
  )

  // Decentraland Commands
  registerCommand('decentraland.commands.init', () => init().then(validate))
  registerCommand('decentraland.commands.update', () => npmInstall())
  registerCommand('decentraland.commands.install', () => install())
  registerCommand('decentraland.commands.uninstall', () => uninstall())
  registerCommand('decentraland.commands.start', () => start())
  registerCommand(
    'decentraland.commands.getDebugURL',
    async () =>
      `${await getServerUrl(ServerName.DCLPreview)}${await getServerParams(
        ServerName.DCLPreview
      )}`
  )
  registerCommand('decentraland.commands.restart', () => restart())
  registerCommand('decentraland.commands.deploy', () => deploy())
  registerCommand('decentraland.commands.deployCustom', async () =>
    deploy(
      `--target ${await vscode.window.showInputBox({
        title: 'Deploy to custom Catalyst',
        prompt: 'Enter the URL of the Catalyst',
        placeHolder: 'peer-testing.decentraland.org',
      })}`
    )
  )
  registerCommand('decentraland.commands.browser.run', () =>
    browser(ServerName.DCLPreview)
  )
  registerCommand('decentraland.commands.browser.deploy', () =>
    browser(ServerName.DCLDeploy)
  )

  // Dependencies
  registerTree(disposables)
  registerCommand('dependencies.commands.delete', (node: Dependency) =>
    npmUninstall(node.label)
  )
  registerCommand('dependencies.commands.update', (node: Dependency) =>
    npmInstall(`${node.label}@latest`)
  )

  // Walkthrough
  registerCommand('walkthrough.createProject', () =>
    init(ProjectType.SCENE).then(validate)
  )
  registerCommand('walkthrough.viewCode', () => {
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
