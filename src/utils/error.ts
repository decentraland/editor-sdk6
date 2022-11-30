/**
 * Returns whether an unknown value is an Error or not
 * @param error
 * @returns
 */
export function isError(error: unknown): error is Error {
  if (
    error !== undefined &&
    error !== null &&
    typeof error === 'object' &&
    error instanceof Error
  ) {
    return true
  }
  return false
}
