import { ProgressLocation } from 'vscode'
import {
  npmInstall,
  warnDecentralandLibrary,
  warnOutdatedDependency,
} from '../../modules/npm'
import { getPort } from '../../modules/port'
import { bin } from '../../modules/bin'
import { SpanwedChild } from '../../modules/spawn'
import { log } from '../../modules/log'
import { loader } from '../../modules/loader'
import { hasNodeModules } from '../../modules/workspace'
import { syncSdkVersion } from '../../modules/sdk'
import { ServerName } from '../../modules/server'

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

    // install dependencies
    if (!hasNodeModules()) {
      await npmInstall()
    }

    // sync sdk version with workspace
    await syncSdkVersion()

    const port = await getPort(ServerName.RunScene)

    log(`RunScene: http server assigned port is ${port}`)

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

    child.on(/field \"decentralandLibrary\" is missing/gi, (data) => {
      const match = /Error in library ((\d|\w|\_|\-)+): field/gi.exec(data!)
      if (match && match.length > 0) {
        const dependency = match[1]
        warnDecentralandLibrary(dependency)
      }
    })

    child.process.on('close', (code) => {
      if (code !== null) {
        log(`RunScene: http server closed with status code ${code}`)
      }
      child = null
    })

    // Show loader while server is starting
    loader(
      'Starting server...',
      async () =>
        Promise.race([
          child?.waitFor(/server is now running/gi, /error/gi),
          child?.wait(),
        ]),
      ProgressLocation.Window
    )
  } catch (error) {
    log('Could not initialize RunScene server')
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
