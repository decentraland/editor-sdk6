import { uuid } from 'uuidv4'
import Analytics from 'analytics-node'
import { log } from './log'
import { getGlobalValue, setGlobalValue } from './storage'
import { getPackageJson } from './pkg'

const ANALYTICS_USER_ID_STORAGE_KEY = 'analytics-user-id'

let analytics: Analytics | null

export function activateAnalytics(key?: string) {
  if (analytics) {
    return
  }

  if (!key) {
    log('Analytics disabled')
    return
  }

  analytics = new Analytics(key)

  getAnalytics().identify({
    userId: getUserId(),
    traits: {
      platform: process.platform,
      arch: process.arch,
      version: getPackageJson().version,
    },
  })
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
  properties?: Record<string, string | number | boolean | null | undefined>
) {
  try {
    getAnalytics().track(
      { event, properties, userId: getUserId() },
      (error) =>
        error &&
        console.warn(`Could not track event "${event}": ${error.message}`)
    )
  } catch (error) {
    // Anaytics disabled
  }
}

export function deactivateAnalytics() {
  if (analytics) {
    analytics = null
  }
}
