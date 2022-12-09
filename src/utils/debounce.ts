/**
 * Returns a debounced function of a given callback
 * @param callback
 * @param ms
 * @returns
 */
export function debounce(callback: (...args: any[]) => any, ms: number) {
  let timeout: NodeJS.Timeout | null = null
  return (...args: any[]) => {
    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(() => {
      timeout = null
      callback(...args)
    }, ms)
  }
}
