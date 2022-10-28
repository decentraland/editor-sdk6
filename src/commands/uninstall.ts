import * as vscode from 'vscode'
import { loader } from '../utils/loader'
import { npmUninstall } from '../utils/npm'
import { exec } from '../utils/run'

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
