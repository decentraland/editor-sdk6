import * as vscode from 'vscode'
import { loader } from './loader'
import { bin } from './bin'
import { refreshTree } from '../dependencies/tree'

/**
 * Installs a list of npm packages, or install all dependencies if no list is provided
 * @param dependencies List of npm packages
 * @returns Promise that resolves when the install finishes
 */
export async function npmInstall(...dependencies: string[]) {
  try {
    return loader(
      dependencies.length > 0
        ? `Installing ${dependencies.join(', ')}...`
        : `Installing dependencies...`,
      () =>
        bin('npm', 'npm', [
          dependencies.length === 0 ? 'install' : 'install --save-bundle',
          ...dependencies,
        ]).wait(),
      dependencies.length > 0
        ? vscode.ProgressLocation.Window
        : vscode.ProgressLocation.Notification
    )
  } catch (error) {
    vscode.window.showErrorMessage(
      `Error installing ${dependencies.length > 0 ? dependencies.join(', ') : 'dependencies'
      }`
    )
  }
}

/**
 * Uninstalls a list of npm packages
 * @param dependencies List of npm packages
 * @returns Promise that resolves when the uninstall finishes
 */
export async function npmUninstall(...dependencies: string[]) {
  if (dependencies.length > 0) {
    return loader(`Uninstalling ${dependencies.join(', ')}...`, () =>
      bin('npm', 'npm', ['uninstall', ...dependencies]).wait()
    )
  }
}

export async function warnOutdatedDependency(dependency: string) {
  const update = "Update"
  const ignore = "Ignore"
  const action = await vscode.window.showWarningMessage(`The dependency "${dependency}" is outdated`, update, ignore)
  if (action === update) {
    await npmInstall(`${dependency}@latest`)
    refreshTree()
  }
}