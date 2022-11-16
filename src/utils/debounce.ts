export function debounce(callback: (...args: any[]) => any, ms: number) {
  let timeout: NodeJS.Timeout | null = null
  return (...args: any[]) => {
    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(callback, ms, ...args)
  }
}