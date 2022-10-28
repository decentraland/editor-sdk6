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
    return
  }

  const option = options.find((option) => option.name === selected)!

  const child = exec('dcl', [
    'init',
    `--project ${option.type}`,
    `--skip-install`,
  ])

  try {
    await Promise.race([
      child.wait(), // if main process halts we stop waiting
      loader(
        `Creating ${option.name.toLowerCase()} project...`,
        () => child.waitFor(/success/gi, /error/gi),
        vscode.ProgressLocation.Notification
      ),
    ])
  } catch (error) {
    if (error instanceof Error) {
      if (/empty/gi.test(error.message)) {
        const option = 'Change folder'
        const selected = await vscode.window.showErrorMessage<string>(
          'The folder where you are trying to create the project must be empty',
          { modal: true },
          option
        )
        const didSelect = selected === option
        if (didSelect) {
          vscode.commands.executeCommand('vscode.openFolder')
        }
      } else {
        vscode.window.showErrorMessage(error.message)
      }
    } else {
      vscode.window.showErrorMessage('Could not create project')
    }
    return
  }

  await npmInstall()
}
