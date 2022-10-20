import * as vscode from 'vscode'
import { loader } from '../utils/loader'
import { run } from '../utils/run'

export async function install() {
  const dependency = await vscode.window.showInputBox({
    title: 'Install package',
    placeHolder: '@dcl/ecs-scene-utils',
    prompt: 'Enter the name of the package',
  })
  if (dependency) {
    return loader(`Installing ${dependency}`, () =>
      run('npm', ['install', dependency])
    )
  }
}
