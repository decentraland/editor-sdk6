import * as vscode from 'vscode'
import env from 'dotenv'
import path from 'path'
import { GLTFPreviewEditorProvider } from './views/gltf-preview/provider'
import { gltfPreviewServer } from './views/gltf-preview/server'
import { inspectorServer } from './views/inspector/server'
import { runSceneServer } from './views/run-scene/server'
import { setExtensionPath, setGlobalStoragePath } from './modules/path'
import { install } from './commands/install'
import { start } from './commands/start'
import { browser } from './commands/browser'
import { uninstall } from './commands/uninstall'
import { deploy } from './commands/deploy'
import { createTree, registerTree } from './views/dependency-tree/tree'
import { init } from './commands/init'
import { restart } from './commands/restart'
import { inspector } from './commands/inspector'
import { Dependency } from './views/dependency-tree/types'
import { npmInstall, npmUninstall } from './modules/npm'
import { checkNodeBinaries, resolveVersion, setVersion } from './modules/node'
import { unwatch, watch } from './modules/watch'
import { log } from './modules/log'
import { setContext } from './modules/context'
import { getMessage, isError } from './modules/error'
import {
  activateAnalytics,
  deactivateAnalytics,
  track,
} from './modules/analytics'
import { activateRollbar, deactivateRollbar, report } from './modules/rollbar'
import { getPackageJson, getPackageVersion } from './modules/pkg'
import { getCwd, isDCL, isEmpty } from './modules/workspace'
import { getServerUrl } from './utils'
import { ServerName } from './types'

export async function activate(context: vscode.ExtensionContext) {
  track('activation:request')
  try {
    // Log extension mode
    const mode =
      context.extensionMode === vscode.ExtensionMode.Development
        ? 'development'
        : context.extensionMode === vscode.ExtensionMode.Production
        ? 'production'
        : 'test'
    log(`Extension mode: ${mode}`)

    // Load .env
    env.config({ path: path.join(context.extensionUri.fsPath, '.env') })

    // Set context
    setContext(context)

    // Set paths
    setExtensionPath(context.extensionUri.fsPath)
    setGlobalStoragePath(context.globalStorageUri.fsPath)

    // Log extension version
    log(`Extension version: ${getPackageJson().version}`)

    // Validate the project folder is a valid DCL project
    await validate()

    // Initialize analytics
    activateAnalytics(process.env.DCL_EDITOR_SEGMENT_KEY)

    // Initialize error reporting
    activateRollbar(context.extensionMode, process.env.DCL_EDITOR_ROLLBAR_KEY)

    // Set node binary version
    setVersion(await resolveVersion())

    // Create dependency tree
    createTree()

    // Helper to register a command
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
    GLTFPreviewEditorProvider.register(disposables)

    // Setup debugger
    vscode.debug.registerDebugConfigurationProvider(
      'decentraland-sdk7',
      {
        resolveDebugConfiguration() {
          if (!isDCL()) {
            throw new Error(
              `The current workspace is not a Decentraland project`
            )
          }
          // It's important to return null here, so the configuration defined in the package.json is used
          return null
        },
      },
      vscode.DebugConfigurationProviderTriggerKind.Dynamic
    )

    // Decentraland Commands
    registerCommand('decentraland-sdk7.commands.init', () =>
      init().then(validate)
    )
    registerCommand('decentraland-sdk7.commands.update', () => npmInstall())
    registerCommand('decentraland-sdk7.commands.install', () => install())
    registerCommand('decentraland-sdk7.commands.uninstall', () => uninstall())
    registerCommand('decentraland-sdk7.commands.start', () => start())
    registerCommand('decentraland-sdk7.commands.getDebugURL', () =>
      getServerUrl(ServerName.RunScene)
    )
    registerCommand('decentraland-sdk7.commands.restart', () => restart())
    registerCommand('decentraland-sdk7.commands.deploy', () => deploy())
    registerCommand('decentraland-sdk7.commands.deployWorld', async () =>
      deploy(
        `--target-content https://worlds-content-server.decentraland.org`,
        true
      )
    )
    registerCommand('decentraland-sdk7.commands.deployTest', async () =>
      deploy(`--target peer-testing.decentraland.org`)
    )
    registerCommand('decentraland-sdk7.commands.deployCustom', async () =>
      deploy(
        `--target ${await vscode.window.showInputBox({
          title: 'Deploy to custom Catalyst',
          prompt: 'Enter the URL of the Catalyst',
          placeHolder: 'peer-testing.decentraland.org',
        })}`
      )
    )
    registerCommand('decentraland-sdk7.commands.browser.run', () =>
      browser(ServerName.RunScene)
    )
    registerCommand('decentraland-sdk7.commands.browser.deploy', () =>
      browser(ServerName.PublishScene)
    )
    registerCommand('decentraland-sdk7.commands.browser.web3', () =>
      browser(ServerName.RunScene, '&ENABLE_WEB3')
    )
    registerCommand('decentraland-sdk7.commands.inspector', async () =>
      inspector()
    )

    // Dependencies
    registerTree(disposables)
    registerCommand(
      'decentraland-sdk7.dependencies.delete',
      (node: Dependency) => npmUninstall(node.label)
    )
    registerCommand(
      'decentraland-sdk7.dependencies.update',
      (node: Dependency) => npmInstall(`${node.label}@latest`)
    )

    // Walkthrough
    registerCommand('decentraland-sdk7.walkthrough.createProject', () =>
      init().then(validate)
    )
    registerCommand('decentraland-sdk7.walkthrough.viewCode', () => {
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
    await checkNodeBinaries()

    // Start servers and watchers
    await boot()

    // report activation success
    const isDecentraland = isDCL()
    const sdkVersion = isDecentraland
      ? getPackageVersion('@dcl/sdk', true)
      : null
    const info = {
      mode,
      is_dcl: isDecentraland,
      is_empty: !isDecentraland && isEmpty(),
      sdk_version: sdkVersion,
    }
    track('activation:success', info)
  } catch (error) {
    track('activation:error', { message: getMessage(error) })
  }
}

export async function deactivate() {
  // Stop watching changes in node_modules
  unwatch()
  // Stop  webservers
  await Promise.all([
    gltfPreviewServer.stop(),
    runSceneServer.stop(),
    inspectorServer.stop(),
  ])
  // Deactivate analytics
  deactivateAnalytics()
  // Deactivate error reporting
  deactivateRollbar()
}

export async function validate() {
  // Set in context if it is valid project
  await vscode.commands.executeCommand(
    'setContext',
    'decentraland-sdk7.isDCL',
    isDCL()
  )

  // Set in context if it is an empty folder
  await vscode.commands.executeCommand(
    'setContext',
    'decentraland.isEmpty',
    isEmpty()
  )
}

async function boot() {
  log(`Workspace: "${getCwd()}"`)
  const isValid = isDCL()
  // Start webservers
  try {
    await (isValid
      ? Promise.all([
          gltfPreviewServer.start(),
          runSceneServer.start(),
          inspectorServer.start(),
        ])
      : gltfPreviewServer.start())
  } catch (error: any) {
    log(`Something went wrong initializing servers:`, error.message)
  }

  // Watch chagnes in node_modules
  if (isValid) {
    watch()
  }
}
