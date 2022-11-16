import { npmInstall, warnOutdatedDependency } from '../utils/npm'
import { hasNodeModules } from '../utils/path'
import { getPort, ServerName } from '../utils/port'
import { bin } from '../utils/bin'
import { SpanwedChild } from '../utils/spawn'
import { log } from '../utils/log'
import { loader } from '../utils/loader'
import { ProgressLocation } from 'vscode'

let child: SpanwedChild | null = null
let isStarting = false

export async function startServer() {
  if (isStarting) {
    return
  }
  isStarting = true

  try {
    if (child) {
      await stopServer()
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
      if (code !== null) {
        log(`DCLPreview: closing server with status code ${code}`)
      }
      child = null
    })

    // Show loader while server is starting
    loader('Starting server...', async () => child?.waitFor(/server is now running/gi, /error/gi), ProgressLocation.Window)
  } catch (error) {
    log('Could not initialize DCLPreview server')
  }

  // unset
  isStarting = false
}

export async function stopServer() {
  if (child && child.alive()) {
    await child.kill()
  }
  child = null
}
