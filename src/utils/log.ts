import * as vscode from 'vscode'
const output = vscode.window.createOutputChannel(`Decentraland`)

export function log(message: string) {
  output.appendLine(message)
}
