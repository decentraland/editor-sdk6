import * as vscode from 'vscode'
import { loader } from './loader'
import { bin } from './bin'
import { restart } from '../commands/restart'
import { stopServer } from '../dcl-preview/server'

/**
 * Installs a list of npm packages, or install all dependencies if no list is provided
 * @param dependencies List of npm packages
 * @returns Promise that resolves when the install finishes
 */
export async function npmInstall(dependency?: string, isLibrary = false) {
  try {
    return loader(
      dependency
        ? `Installing ${dependency}...`
        : `Installing dependencies...`,
      async () => {
        await stopServer()
        await bin('npm', 'npm', [
          dependency && isLibrary
            ? 'install --save-bundle'
            : 'install',
          dependency,
        ]).wait()
        await restart() // restart server after installing packages
      },
      dependency
        ? vscode.ProgressLocation.Window
        : vscode.ProgressLocation.Notification
    )
  } catch (error) {
    vscode.window.showErrorMessage(
      `Error installing ${dependency || 'dependencies'}`
    )
  }
}

/**
 * Uninstalls a list of npm packages
 * @param dependencies List of npm packages
 * @returns Promise that resolves when the uninstall finishes
 */
export async function npmUninstall(dependency: string) {
  return loader(`Uninstalling ${dependency}...`, async () => {
    await stopServer()
    await bin('npm', 'npm', ['uninstall', dependency])
      .wait()
    await restart() // restart server after uninstalling packages
  })
}

export async function warnOutdatedDependency(dependency: string) {
  const update = "Update"
  const ignore = "Ignore"
  const action = await vscode.window.showWarningMessage(`The dependency "${dependency}" is outdated`, update, ignore)
  if (action === update) {
    await npmInstall(`${dependency}@latest`)
  }
}