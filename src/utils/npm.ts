import * as vscode from 'vscode'
import { loader } from './loader'
import { exec } from './run'
import { sleep } from './sleep'

/**
 * Installs a list of npm packages, or install all dependencies if no list is provided
 * @param dependencies List of npm packages
 * @returns Promise that resolves when the install finishes
 */
export async function npmInstall(...dependencies: string[]) {
  try {
    const child = exec('npm', ['install', ...dependencies])

    return vscode.window.withProgress(
      {
        location:
          dependencies.length > 0
            ? vscode.ProgressLocation.Window
            : vscode.ProgressLocation.Notification,
        cancellable: false,
        title:
          dependencies.length > 0
            ? `Installing ${dependencies.join(', ')}...`
            : `Installing dependencies...`,
      },
      async (progress) => {
        let increment = 1
        let total = 0
        progress.report({ increment })

        // once the process finishes, move fast towards 100%
        let finished = false
        let target = 0
        const done = () => {
          finished = true
          target = 100
        }
        child.wait().then(done).catch(done)

        // move slowly towards 100% while process not finished
        while (!finished || total < 99) {
          increment += (target - increment) / 50
          total += increment
          progress.report({ increment })
          await sleep(50)
        }

        // finish progress
        progress.report({ increment: 100 })

        // this await here is just in case the promise rejected, then this bubbles the error up, if it resolved then it just ignores it
        await child.wait()
      }
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
    return loader(`Uninstalling ${dependencies.join(', ')}...`, () =>
      exec('npm', ['uninstall', ...dependencies]).wait()
    )
  }
}
