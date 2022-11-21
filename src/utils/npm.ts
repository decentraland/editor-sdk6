import * as vscode from 'vscode'
import { loader } from './loader'
import { bin } from './bin'
import { restart } from '../commands/restart'
import { stopServer } from '../dcl-preview/server'
import { getLocalValue, setLocalValue } from './storage'

/**
 * Installs a list of npm packages, or install all dependencies if no list is provided
 * @param dependencies List of npm packages
 * @returns Promise that resolves when the install finishes
 */
export async function npmInstall(dependency?: string, isLibrary = false) {
  try {
    return loader(
      dependency ? `Installing ${dependency}...` : `Installing dependencies...`,
      async () => {
        await stopServer()
        await bin('npm', 'npm', [
          dependency && isLibrary ? 'install --save-bundle' : 'install',
          dependency,
        ]).wait()
        await restart() // restart server after installing packages
      },
      dependency
        ? vscode.ProgressLocation.Window
        : vscode.ProgressLocation.Notification
    )
  } catch (error) {
    throw new Error(`Error installing ${dependency || 'dependencies'}`)
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
    await bin('npm', 'npm', ['uninstall', dependency]).wait()
    await restart() // restart server after uninstalling packages
  })
}

export async function warnOutdatedDependency(dependency: string) {
  const storageKey = `ignore:${dependency}`
  const isIgnored = getLocalValue<boolean>(storageKey)
  if (isIgnored) {
    return
  }
  const update = 'Update'
  const ignore = 'Ignore'
  const action = await vscode.window.showWarningMessage(
    `The dependency "${dependency}" is outdated`,
    update,
    ignore
  )
  if (action === update) {
    await npmInstall(`${dependency}@latest`)
  } else if (action === ignore) {
    setLocalValue(storageKey, true)
  }
}

export async function warnDecentralandLibrary(dependency: string) {
  const reinstall = 'Re-install'
  const remove = 'Remove'
  const action = await vscode.window.showErrorMessage(
    `The dependency "${dependency}" is not a valid Decentraland library. You can re-install it as non-library, or remove it.`,
    reinstall,
    remove
  )
  await npmUninstall(dependency)
  if (action === reinstall) {
    await npmInstall(dependency)
  }
}
