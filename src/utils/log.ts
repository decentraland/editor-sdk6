import * as vscode from 'vscode'
const output = vscode.window.createOutputChannel(`Decentraland`)

/**
 * Util to print messages to the Output channel
 * @param message a string to print
 */
export function log(...messages: string[]) {
  output.appendLine(messages.join(' '))
}
