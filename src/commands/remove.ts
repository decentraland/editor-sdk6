import * as vscode from 'vscode'
import { loader } from '../utils/loader'
import { run } from '../utils/run'

export async function remove(dependency: string) {
  return loader(`Uninstalling ${dependency}`, () =>
    run('npm', ['uninstall', dependency])
  )
}
