import Rollbar from 'rollbar'
import { ExtensionMode } from 'vscode'
import { log } from './log'

let rollbar: Rollbar | null = null

export function activateRollbar(mode: ExtensionMode, key?: string) {
  if (rollbar) {
    console.warn('Rollbar already initialized')
    return
  }

  if (!key) {
    log(`Reporting disabled`)
    return
  }

  rollbar = new Rollbar({
    accessToken: key,
    captureUncaught: true,
    captureUnhandledRejections: true,
    environment:
      mode === ExtensionMode.Development
        ? 'development'
        : mode === ExtensionMode.Production
        ? 'production'
        : 'test',
  })
}

export function getRollbar() {
  if (!rollbar) {
    throw new Error('Rollbar has not been initialized yet')
  }
  return rollbar
}

export function report(error: Error) {
  try {
    getRollbar().error(error)
  } catch (e) {
    // Error reporting disabled
  }
}

export function deactivateRollbar() {
  if (rollbar) {
    rollbar = null
  }
}
