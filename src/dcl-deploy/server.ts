import { ChildProcess } from 'child_process'
import crossSpawn from 'cross-spawn'
import { getCwd, getLocalBinPath } from '../utils/path'
import { getPort, ServerName } from '../utils/port'

let child: ChildProcess | null = null

export async function startServer() {
  const path = getLocalBinPath('dcl')
  const cwd = getCwd()
  const port = await getPort(ServerName.DCLDeploy)

  console.log(`DCLDeploy: deploy server started on port ${port}`)

  child = crossSpawn(path, ['deploy', `-p ${port}`, '--no-browser'], {
    shell: true,
    cwd,
    env: { ...process.env },
  })

  child.stdout!.pipe(process.stdout)
  child.stderr!.pipe(process.stderr)
}

export async function stopServer() {
  if (child && !child.killed) {
    console.log('DCLDeploy: killing process')
    child.kill()
  }
  child = null
}
