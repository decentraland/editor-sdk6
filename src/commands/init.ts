import * as vscode from 'vscode'
import { loader } from '../utils/loader'
import { npmInstall } from '../utils/npm'
import { getTypeOptions, ProjectType } from '../utils/project'
import { bin } from '../utils/bin'

export async function init(type?: ProjectType) {
  const options = getTypeOptions()

  let option: {
    type: ProjectType
    name: string
  } | null = type
    ? options.find((option) => option.type === type) || null
    : null

  if (!option) {
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

    option = options.find((option) => option.name === selected)!
  }

  const child = bin('decentraland', 'dcl', [
    'init',
    `--project ${option.type}`,
    `--skip-install`,
  ])

  try {
    await loader(
      `Creating ${option.name.toLowerCase()} project...`,
      () =>
        Promise.race([
          child.wait(), // if main process halts we stop waiting
          child.waitFor(/success/gi, /error/gi),
        ]),
      vscode.ProgressLocation.Notification
    )
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
          await vscode.commands.executeCommand('vscode.openFolder')
        }
      } else {
        throw new Error(error.message)
      }
    } else {
      throw new Error('Could not create project')
    }
    return
  }

  await npmInstall()

  vscode.window.showInformationMessage('Project created successfully!')
}
