import * as vscode from 'vscode'

export async function loader(
  title: string,
  waitFor: (
    progress: vscode.Progress<{
      message?: string | undefined
      increment?: number | undefined
    }>
  ) => Promise<void>
) {
  return vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Window,
      cancellable: false,
      title,
    },
    async (progress) => {
      progress.report({ increment: 0 })
      await waitFor(progress)
      progress.report({ increment: 100 })
    }
  )
}
