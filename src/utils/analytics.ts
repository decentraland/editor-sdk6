import * as vscode from 'vscode'
import Analytics from 'analytics-node'
import { log } from './log'
import { getGlobalValue, setGlobalValue } from './storage'
import { uuid } from 'uuidv4'

let analytics: Analytics | null
const ANALYTICS_USER_ID_STORAGE_KEY = 'analytics-user-id'

export function initAnalytics(mode: vscode.ExtensionMode) {
  switch (mode) {
    case vscode.ExtensionMode.Production: {
      log(`Extension mode: prd`)
      analytics = new Analytics('KGh0HDHgMmWljxg72wARAUPlG2rjhr5h')
      break
    }
    case vscode.ExtensionMode.Development: {
      log(`Extension mode: dev`)
      analytics = new Analytics('8CZJcrF0pIBWikj3IEpZqxO60Z5WtPvH')
      break
    }
    default:
    // Ignore others like testing env
  }
  getAnalytics().identify({ userId: getUserId() })
}

export function getUserId() {
  let userId = getGlobalValue(ANALYTICS_USER_ID_STORAGE_KEY) as
    | string
    | undefined
    | null
  if (!userId || typeof userId !== 'string') {
    userId = uuid()
    setGlobalValue(ANALYTICS_USER_ID_STORAGE_KEY, userId)
  }
  return userId as string
}

export function getAnalytics() {
  if (!analytics) {
    throw new Error(`Analytics were not initialized yet`)
  }
  return analytics
}

export function track(
  event: string,
  properties?: Record<string, string | number | boolean>
) {
  getAnalytics().track(
    { event, properties, userId: getUserId() },
    (error) =>
      error &&
      console.warn(`Could not track event "${event}": ${error.message}`)
  )
}
