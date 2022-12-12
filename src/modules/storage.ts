import { getContext } from './context'

export function getLocalValue<T>(key: string) {
  const context = getContext()
  return context.workspaceState.get<T>(key)
}

export function setLocalValue<T>(key: string, value: T) {
  const context = getContext()
  context.workspaceState.update(key, value)
}

export function getGlobalValue<T>(key: string) {
  const context = getContext()
  return context.globalState.get<T>(key)
}

export function setGlobalValue<T>(key: string, value: T) {
  const context = getContext()
  context.globalState.update(key, value)
}
