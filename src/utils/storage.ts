import { getContext } from "./context"

export function getValue<T>(key: string) {
  const context = getContext()
  return context.workspaceState.get<T>(key)
}

export function setValue<T>(key: string, value: T) {
  const context = getContext()
  context.workspaceState.update(key, value)
}