import * as vscode from 'vscode'
import * as path from 'path'
import { getExtensionPath } from '../../modules/path'

export class Dependency extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    private version: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(label, collapsibleState)
    this.tooltip = `${this.label}@${this.version}`
    this.description = this.version
  }

  iconPath = {
    light: path.join(
      getExtensionPath(),
      'resources',
      'light',
      'dependency.svg'
    ),
    dark: path.join(getExtensionPath(), 'resources', 'dark', 'dependency.svg'),
  }

  contextValue = 'dependency'
}
