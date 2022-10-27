import * as vscode from 'vscode'
import { loader } from '../utils/loader'
import { npmInstall } from '../utils/npm'
import { getTypeOptions, ProjectType } from '../utils/project'
import { exec } from '../utils/run'
import { sleep } from '../utils/sleep'

export async function init() {
  const options = getTypeOptions()
  const selected = await vscode.window.showQuickPick(
    options.map((option) => option.name),
    {
      ignoreFocusOut: true,
      title: 'Create Project',
      placeHolder: 'Select the project type',
    }
  )
  if (!selected) {
    return vscode.window.showErrorMessage('You must select a project type')
  }

  const option = options.find((option) => option.name === selected)!

  const child = exec('dcl', [
    'init',
    `--project ${option.type}`,
    `--skip-install`,
  ])

  child.wait().catch((error) => console.log(error))

  try {
    await loader(
      `Creating ${option.name.toLowerCase()} project...`,
      () => child.waitFor(/success/gi, /error/gi),
      vscode.ProgressLocation.Notification
    )
  } catch (error) {
    if (error instanceof Error) {
      if (/empty/gi.test(error.message)) {
        vscode.window.showErrorMessage(
          'The folder where you are trying to create the project must be empty'
        )
      } else {
        vscode.window.showErrorMessage(error.message)
      }
    } else {
      vscode.window.showErrorMessage('Could not create project')
    }
    return
  }

  await sleep(1000)

  await loader(
    `Installing dependencies...`,
    () => npmInstall(),
    vscode.ProgressLocation.Notification
  )
}
