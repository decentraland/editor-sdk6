import * as vscode from 'vscode'
import { loader } from './loader'
import { exec } from './run'

/**
 * Installs a list of npm packages, or install all dependencies if no list is provided
 * @param dependencies List of npm packages
 * @returns Promise that resolves when the install finishes
 */
export async function npmInstall(...dependencies: string[]) {
  try {
    return await loader(
      dependencies.length > 0
        ? `Installing ${dependencies.join(', ')}`
        : `Installing dependencies`,
      () => exec('npm', ['install', ...dependencies]).wait()
    )
  } catch (error) {
    vscode.window.showErrorMessage(
      `Error installing ${
        dependencies.length > 0 ? dependencies.join(', ') : 'dependencies'
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
    return loader(`Uninstalling ${dependencies.join(', ')}`, () =>
      exec('npm', ['uninstall', ...dependencies]).wait()
    )
  }
}
