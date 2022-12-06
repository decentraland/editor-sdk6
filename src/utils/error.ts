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

/**
 * Return the error message from an unknown error value
 * @param error
 * @returns
 */
export function getMessage(error: unknown): string {
  return isError(error) ? error.message : 'Unknown Error'
}
