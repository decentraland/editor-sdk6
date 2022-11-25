import Rollbar from 'rollbar'
import { ExtensionMode } from 'vscode'

let rollbar: Rollbar | null = null

export function initRollbar(mode: ExtensionMode) {
  if (rollbar) {
    throw new Error('Rollbar already initialized')
  }
  rollbar = new Rollbar({
    accessToken: 'd22616f4af5b4788bac515818ca785f4',
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
    console.warn('Could not report error', e)
  }
}
