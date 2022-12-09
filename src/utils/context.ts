import { ExtensionContext } from 'vscode'
import { log } from './log'

let context: ExtensionContext | null = null

/**
 * Sets the extension's context
 * @param _context
 */
export function setContext(_context: ExtensionContext | null) {
  context = _context
  log(
    context
      ? 'Extension context has been set'
      : 'Extension context has been unset'
  )
}

/**
 * Returns the extension's context
 * @param _context
 */
export function getContext() {
  if (!context) {
    throw Error(`Context has not been set yet`)
  }
  return context
}
