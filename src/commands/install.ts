import * as vscode from 'vscode'
import spawn from 'cross-spawn'
import future from 'fp-future'
import path from 'path'
import { getExtensionPath } from '../utils/get-extension-path'

export async function install(dependencies?: string[]) {
  const promise = future<void>()

  // get the right path to the binary according to the user OS
  const pathToNpm = path.join(
    getExtensionPath(),
    './node_modules/.bin/',
    /^win/.test(process.platform) ? 'npm.cmd' : 'npm'
  )

  if (
    vscode.workspace.workspaceFolders &&
    vscode.workspace.workspaceFolders.length > 0
  ) {
    // get current working directory
    const cwd = vscode.workspace.workspaceFolders[0]

    // build command
    let args = ['install']
    if (Array.isArray(dependencies)) {
      args = [...args, ...dependencies]
    }

    // spawn npm into child process
    const child = spawn(pathToNpm, args, {
      shell: true,
      cwd: cwd.uri.path,
      env: { ...process.env },
    })
    child.stdout!.pipe(process.stdout)
    child.stderr!.pipe(process.stderr)
    child.on('close', (code) => {
      if (code !== 0) {
        promise.reject(new Error(`Error: npm exited with code "${code}".`))
      } else {
        promise.resolve(void 0)
      }
    })
  } else {
    promise.reject(new Error(`Could not get the workspace directory`))
  }

  // return as promise
  return promise
}
