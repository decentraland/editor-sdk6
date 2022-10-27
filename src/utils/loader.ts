import * as vscode from 'vscode'

export async function loader(
  title: string,
  waitFor: (
    progress: vscode.Progress<{
      message?: string | undefined
      increment?: number | undefined
    }>
  ) => Promise<void>,
  location: vscode.ProgressLocation = vscode.ProgressLocation.Window,
  cancellable = false
) {
  return vscode.window.withProgress(
    {
      location,
      cancellable,
      title,
    },
    async (progress) => {
      progress.report({ increment: 0 })
      await waitFor(progress)
      progress.report({ increment: 100 })
    }
  )
}
