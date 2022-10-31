import * as vscode from 'vscode'
import { sleep } from './sleep'

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
      let increment = 1
      let total = 0
      progress.report({ increment })

      const promise = waitFor(progress)

      // once the process finishes, move fast towards 100%
      let finished = false
      let target = 0
      const done = () => {
        finished = true
        target = 100
      }
      promise.then(done).catch(done)

      // move slowly towards 100% while process not finished
      while (!finished || total < 99) {
        increment += (target - increment) / 75
        total += increment
        progress.report({ increment })
        await sleep(50)
      }

      // finish progress
      progress.report({ increment: 100 })

      // this await here is just in case the promise rejected, then this bubbles the error up, if it resolved then it just ignores it
      await promise
    }
  )
}
