import * as vscode from 'vscode'
import { npmInstall } from '../modules/npm'

export async function install() {
  const dependency = await vscode.window.showInputBox({
    title: 'Install package',
    placeHolder: '@dcl/ecs-scene-utils',
    prompt: 'Enter the name of the package',
  })
  if (!dependency) {
    return
  }

  const YES = 'Yes'
  const NO = 'No'

  const isLibrary = await vscode.window.showQuickPick([YES, NO], {
    ignoreFocusOut: true,
    title: 'Is this a Decentraland library?',
  })

  return npmInstall(dependency, isLibrary === YES)
}
