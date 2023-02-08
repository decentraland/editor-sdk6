import * as vscode from 'vscode'
import { loader } from '../modules/loader'
import { npmInstall } from '../modules/npm'
import { bin } from '../modules/bin'

export async function init() {
  const child = bin('@dcl/sdk', 'sdk-commands', ['init'])

  await loader(
    `Creating project...`,
    () => child.wait(),
    vscode.ProgressLocation.Notification
  )

  await npmInstall()

  vscode.window.showInformationMessage('Project created successfully!')
}
