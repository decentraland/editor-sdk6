import { ChildProcess } from 'child_process'
import crossSpawn from 'cross-spawn'
import future from 'fp-future'
import { getCwd, getLocalBinPath } from '../utils/path'
import { getPort, ServerName } from '../utils/port'

let child: ChildProcess | null = null

export async function startServer(...args: string[]) {
  if (child) {
    stopServer()
  }

  const promise = future<void>()

  const path = getLocalBinPath('dcl')
  const cwd = getCwd()
  const port = await getPort(ServerName.DCLDeploy)

  console.log(`DCLDeploy: deploy server started on port ${port}`)

  child = crossSpawn(
    path,
    ['deploy', `--port ${port}`, `--no-browser`, ...args],
    {
      shell: true,
      cwd,
      env: { ...process.env },
    }
  )

  child.stdout!.pipe(process.stdout)
  child.stderr!.pipe(process.stderr)

  child.on('close', (code) => {
    console.log(`DCLDeploy: closing server with status code ${code}`)
    child = null
    if (code !== 0) {
      promise.reject(new Error(`DCLDeploy: exit code ${code}`))
    }
  })

  child.on('data', (data) => console.log('DATUSA', data))

  function handleMessage(msg: string) {
    if (/Content uploaded/.test(msg)) {
      promise.resolve()
    }
  }

  child.stdout!.addListener('data', (data) => handleMessage(data.toString()))
  child.stderr!.addListener('data', (data) => handleMessage(data.toString()))

  promise.finally(() => {
    if (child) {
      child.removeAllListeners()
    }
  })

  return promise
}

export async function stopServer() {
  if (child && !child.killed) {
    console.log('DCLDeploy: killing process')
    child.kill()
  }
  child = null
}
