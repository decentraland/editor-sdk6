import * as vscode from 'vscode'
import { loader } from './loader'
import { bin } from './bin'
import { restart } from '../commands/restart'
import { stopServer } from '../views/run-scene/server'
import { getLocalValue, setLocalValue } from './storage'
import { track } from './analytics'
import { getMessage } from './error'

/**
 * Installs a list of npm packages, or install all dependencies if no list is provided
 * @param dependencies List of npm packages
 * @returns Promise that resolves when the install finishes
 */
export async function npmInstall(dependency?: string, isLibrary = false) {
  try {
    return await loader(
      dependency ? `Installing ${dependency}...` : `Installing dependencies...`,
      async () => {
        await stopServer()
        track(`npm.install`, { dependency: dependency || null })
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
    throw new Error(
      `Error installing ${dependency || 'dependencies'}: ${getMessage(error)}`
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
    track(`npm.uninstall`, { dependency })
    await bin('npm', 'npm', ['uninstall', dependency]).wait()
    await restart() // restart server after uninstalling packages
  })
}

/**
 * Warns the user that a dependency is outdated, allows them to upgrade it
 * @param dependency
 * @returns
 */
export async function warnOutdatedDependency(dependency: string) {
  const storageKey = `ignore:${dependency}`
  const isIgnored = getLocalValue<boolean>(storageKey)
  if (isIgnored) {
    return
  }
  const update = 'Update'
  const ignore = 'Ignore'
  track(`npm.warn_outdated_dependency:show`)
  const action = await vscode.window.showWarningMessage(
    `The dependency "${dependency}" is outdated`,
    update,
    ignore
  )
  if (action === update) {
    await npmInstall(`${dependency}@latest`)
    track(`npm.warn_outdated_dependency:update`)
  } else if (action === ignore) {
    setLocalValue(storageKey, true)
    track(`npm.warn_outdated_dependency:ignore`)
  }
}

/**
 * Warns the user that a dependency that is installed as a library is not, allows them to reinstall it
 * @param dependency
 */
export async function warnDecentralandLibrary(dependency: string) {
  const reinstall = 'Re-install'
  const remove = 'Remove'
  track(`npm.warn_decentraland_library:show`)
  const action = await vscode.window.showErrorMessage(
    `The dependency "${dependency}" is not a valid Decentraland library. You can re-install it as non-library, or remove it.`,
    reinstall,
    remove
  )
  await npmUninstall(dependency)
  if (action === reinstall) {
    await npmInstall(dependency)
    track(`npm.warn_decentraland_library:reinstall`)
  } else {
    track(`npm.warn_decentraland_library:remove`)
  }
}
