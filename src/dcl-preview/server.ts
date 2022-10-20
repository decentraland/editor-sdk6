import { ChildProcess } from 'child_process'
import crossSpawn from 'cross-spawn'
import { getCwd, getLocalBinPath } from '../utils/path'
import { getPort, ServerName } from '../utils/port'

let child: ChildProcess | null = null

export async function startServer() {
  if (child) {
    stopServer()
  }
  try {
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

    child.on('close', (code) => {
      console.log(`DCLDeploy: closing server with status code ${code}`)
      child = null
    })
  } catch (error) {
    console.error('Could not initialize DCLPreview server')
  }
}

export async function stopServer() {
  if (child && !child.killed) {
    console.log('DCLPreview: killing process')
    child.kill()
  }
  child = null
}
