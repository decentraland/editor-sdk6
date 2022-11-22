import * as vscode from 'vscode'
import { SpanwedChild } from './spawn'

const output = vscode.window.createOutputChannel(`Decentraland`)

let outputData = ''

/**
 * Append a message to the output
 */
export function append(message: string) {
  outputData += message
  output.append(message)
}

/**
 * Append a message to the output in a new line
 */
export function appendLine(message: string) {
  const line = message + '\n'
  outputData += line
  output.append(line)
}

/**
 * Replace the whole output channel
 */
export function replace(message: string) {
  outputData = message
  output.replace(message)
}

/**
 * Clear output channel
 */
export function clear() {
  outputData = ''
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
