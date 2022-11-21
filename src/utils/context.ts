import { ExtensionContext } from 'vscode'
import { log } from './log'

let context: ExtensionContext | null = null

export function setContext(_context: ExtensionContext) {
  context = _context
  log('Extension context has been set')
}

export function getContext() {
  if (!context) {
    throw Error(`Context has not been set yet`)
  }
  return context
}
