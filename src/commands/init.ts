import * as vscode from 'vscode'
import fs from 'fs'
import { loader } from '../modules/loader'
import { npmInstall } from '../modules/npm'
import {
  getSdkOptions,
  getTemplates,
  getProjectTypeOptions,
  ProjectType,
  SdkVersion,
} from '../modules/project'
import { bin } from '../modules/bin'
import { track } from '../modules/analytics'
import { pick } from '../modules/pick'

export async function init() {
  const sdkOptions = getSdkOptions()
  const selectedSdk = await pick(sdkOptions, 'name', {
    ignoreFocusOut: true,
    title: 'Create Project',
    placeHolder: 'Select the SDK version',
  })

  if (!selectedSdk) {
    return
  }

  track(`decentraland.commands.init:select_sdk_version`, {
    version: selectedSdk.version,
  })

  switch (selectedSdk.version) {
    case SdkVersion.SDK6: {
      const params = await getSdk6InitParams()
      if (!params) {
        return
      }
      await initSdk6(params.type, params.templateUrl)
      break
    }
    case SdkVersion.SDK7: {
      await initSdk7()
      break
    }
  }
}

export async function getSdk6InitParams(): Promise<{
  type: ProjectType
  templateUrl?: string
} | null> {
  const projectTypes = getProjectTypeOptions()
  const selectedProjectType = await pick(projectTypes, 'name', {
    ignoreFocusOut: true,
    title: 'Create Project',
    placeHolder: 'Select the project type',
  })

  if (!selectedProjectType) {
    return null
  }

  track(`decentraland.commands.init:select_project_type`, {
    type: selectedProjectType.type,
  })

  if (selectedProjectType.type === ProjectType.SCENE) {
    const selectedTemplate = await pick(getTemplates(), 'title', {
      ignoreFocusOut: true,
      title: 'Select Template',
      placeHolder: 'Select the project template',
    })

    if (!selectedTemplate) {
      return null
    }

    track(`decentraland.commands.init:select_template`, {
      title: selectedTemplate.title,
      url: selectedTemplate.url,
    })

    return {
      type: selectedProjectType.type,
      templateUrl: selectedTemplate.url,
    }
  } else {
    return {
      type: selectedProjectType.type,
    }
  }
}

export async function initSdk6(type: ProjectType, templateUrl?: string) {
  let templateArg = templateUrl ? `--template ${templateUrl}` : ''

  const child = bin('decentraland', 'dcl', [
    'init',
    `--project ${type}`,
    `--skip-install`,
    templateArg,
  ])

  try {
    await loader(
      `Creating ${type} project...`,
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

export async function initSdk7() {
  const child = bin('@dcl/sdk', 'sdk-commands', ['init', `--skip-install`])

  await child.wait()

  await npmInstall()

  vscode.window.showInformationMessage('Project created successfully!')
}
