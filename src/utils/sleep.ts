/**
 * Returns a promise that resolves in a given amount of milliseconds
 * @param ms amount of milliseconds
 * @returns
 */
export const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms))
