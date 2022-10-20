import * as vscode from 'vscode'
import { loader } from '../utils/loader'
import { run } from '../utils/run'

export async function uninstall() {
  const dependency = await vscode.window.showInputBox({
    title: 'Uninstall package',
    placeHolder: '@dcl/ecs-scene-utils',
    prompt: 'Enter the name of the package',
  })
  if (dependency) {
    return loader(`Uninstalling ${dependency}`, () =>
      run('npm', ['uninstall', dependency])
    )
  }
}
