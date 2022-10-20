import { loader } from './loader'
import { run } from './run'

/**
 * Installs a list of npm packages, or install all dependencies if no list is provided
 * @param dependencies List of npm packages
 * @returns Promise that resolves when the install finishes
 */
export async function npmInstall(...dependencies: string[]) {
  return loader(
    dependencies.length > 0
      ? `Installing ${dependencies.join(', ')}`
      : `Installing dependencies`,
    () => run('npm', ['install', ...dependencies])
  )
}

/**
 * Uninstalls a list of npm packages
 * @param dependencies List of npm packages
 * @returns Promise that resolves when the uninstall finishes
 */
export async function npmUninstall(...dependencies: string[]) {
  if (dependencies.length > 0) {
    return loader(`Uninstalling ${dependencies.join(', ')}`, () =>
      run('npm', ['uninstall', ...dependencies])
    )
  }
}
