import { captureException, init } from '@sentry/node'
import { ExtensionMode } from 'vscode'
import { log } from './log'

let reportingEnabled: boolean = false

export function activateSentry(mode: ExtensionMode, dsn?: string) {
  if (reportingEnabled) {
    console.warn('Sentry already initialized')
    return
  }

  if (!dsn) {
    log(`Reporting disabled`)
    return
  }

  init({
    dsn,
    environment:
      mode === ExtensionMode.Development
        ? 'development'
        : mode === ExtensionMode.Production
        ? 'production'
        : 'test',
  })

  reportingEnabled = true
}

export function report(error: Error) {
  // Error reporting disabled
  if (!reportingEnabled) return

  captureException(error)
}

export function deactivateSentry() {
  if (reportingEnabled) {
    reportingEnabled = false
  }
}
