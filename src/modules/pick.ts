import * as vscode from 'vscode'

/**
 * Helper to pick an item from a list, by showing options to the user
 * @param items
 * @param labelKey
 * @param options
 * @returns
 */
export async function pick<T>(
  items: T[],
  labelKey: keyof T,
  options?: vscode.QuickPickOptions
) {
  const labels = items.map((item) => item[labelKey] as string)
  const selectedLabel = await vscode.window.showQuickPick(labels, options)
  const selectedItem = items.find((item) => item[labelKey] === selectedLabel)
  return selectedItem || null
}
