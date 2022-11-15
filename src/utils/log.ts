import * as vscode from 'vscode'
import { SpanwedChild } from './spawn'

const output = vscode.window.createOutputChannel(`Decentraland`)

/**
 * Util to print messages to the Output channel
 * @param message a string to print
 */
export function log(...messages: string[]) {
  output.appendLine(messages.join(' '))
}

/**
 * Utils to bind a spawned process to the output channel
 */
export function bind(child: SpanwedChild) {
  child.on(/.*/, (data) => {
    if (data) {
      output.append(data)
      if (/err/gi.test(data)) {
        focus()
      }
    }
  })
}

/**
 * Util to focus the 
 */
export function focus() {
  output.show()
}