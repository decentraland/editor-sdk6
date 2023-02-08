import * as vscode from 'vscode'
import { SpanwedChild } from './spawn'

export const output = vscode.window.createOutputChannel(`Decentraland SDK7`)

/**
 * Append a message to the output
 */
export function append(message: string) {
  output.append(message)
}

/**
 * Append a message to the output in a new line
 */
export function appendLine(message: string) {
  append(message + '\n')
}

/**
 * Replace the whole output channel
 */
export function replace(message: string) {
  output.replace(message)
}

/**
 * Clear output channel
 */
export function clear() {
  output.clear()
}

/**
 * Util to print messages to the Output channel
 * @param message a string to print
 */
export function log(...messages: string[]) {
  const line = messages.join(' ') + '\n'
  append(line)
}

/**
 * Utils to bind a spawned process to the output channel
 */
export function bind(child: SpanwedChild) {
  child.on(/.*/, (data) => {
    if (data) {
      output.append(data)
      // focus on errors, but not the ones about outdated packages
      if (/err/gi.test(data) && !/outdated/gi.test(data)) {
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
