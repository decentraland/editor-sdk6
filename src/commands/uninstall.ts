import * as vscode from 'vscode'
import { npmUninstall } from '../utils/npm'

export async function uninstall() {
  const dependency = await vscode.window.showInputBox({
    title: 'Uninstall package',
    placeHolder: '@dcl/ecs-scene-utils',
    prompt: 'Enter the name of the package',
  })
  if (dependency) {
    return npmUninstall(dependency)
  }
}
