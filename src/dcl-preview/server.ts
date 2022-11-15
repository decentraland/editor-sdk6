import { npmInstall, warnOutdatedDependency } from '../utils/npm'
import { hasNodeModules } from '../utils/path'
import { getPort, ServerName } from '../utils/port'
import { bin } from '../utils/bin'
import { SpanwedChild } from '../utils/spawn'
import { log } from '../utils/log'

let child: SpanwedChild | null = null
let isStarting = false

export async function startServer() {
  if (isStarting) {
    return
  }
  isStarting = true

  try {
    if (child) {
      stopServer()
    }

    if (!hasNodeModules()) {
      await npmInstall()
    }

    const port = await getPort(ServerName.DCLPreview)

    log(`DCLPreview: preview server started on port ${port}`)

    child = bin('decentraland', 'dcl', [
      'start',
      `-p ${port}`,
      '--no-browser',
      '--skip-install',
    ])

    child.on(/package is outdated/gi, (data) => {
      const match = /npm install ((\d|\w|\_|\-)+)@latest/gi.exec(data!)
      if (match && match.length > 0) {
        const dependency = match[1]
        warnOutdatedDependency(dependency)
      }
    })

    child.process.on('close', (code) => {
      log(`DCLPreview: closing server with status code ${code}`)
      child = null
    })

    // catch promise so it doesn't throw 
    child.wait().catch()
  } catch (error) {
    log('Could not initialize DCLPreview server')
  }

  // unset
  isStarting = false
}

export async function stopServer() {
  if (child && !child.process.killed) {
    log('DCLPreview: killing process')
    child.process.kill()
  }
  child = null
}
