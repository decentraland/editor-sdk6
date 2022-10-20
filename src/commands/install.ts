import * as vscode from 'vscode'
import { npmInstall } from '../utils/npm'

export async function install() {
  const dependency = await vscode.window.showInputBox({
    title: 'Install package',
    placeHolder: '@dcl/ecs-scene-utils',
    prompt: 'Enter the name of the package',
  })
  if (dependency) {
    return npmInstall(dependency)
  }
}
