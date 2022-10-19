import * as vscode from 'vscode'
import { ChildProcess } from 'child_process'
import crossSpawn from 'cross-spawn'
import fetch from 'node-fetch'
import { getCwd, getLocalBinPath } from '../utils/path'
import { getPort, ServerName } from '../utils/port'
import { sleep } from '../utils/sleep'

let child: ChildProcess | null = null

export async function startServer() {
  const path = getLocalBinPath('dcl')
  const cwd = getCwd()
  const port = await getPort(ServerName.DCLPreview)

  console.log(`DCLPreview: preview server started on port ${port}`)

  child = crossSpawn(path, ['start', `-p ${port}`, '--no-browser'], {
    shell: true,
    cwd,
    env: { ...process.env },
  })

  child.stdout!.pipe(process.stdout)
  child.stderr!.pipe(process.stderr)
}

export async function waitForServer() {
  const port = await getPort(ServerName.DCLPreview)
  const url = `http://localhost:${port}`
  while (true) {
    try {
      await fetch(url)
      return
    } catch (error) {
      await sleep(500)
    }
  }
}

export async function stopServer() {
  if (child && !child.killed) {
    console.log('DCLPreview: killing process')
    child.kill()
  }
  child = null
}

export async function getServerUrl() {
  const port = await getPort(ServerName.DCLPreview)
  const url = await vscode.env.asExternalUri(
    vscode.Uri.parse(`http://localhost:${port}`)
  )
  return url.toString()
}
