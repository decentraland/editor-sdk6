import { npmInstall, warnOutdatedDependency } from '../utils/npm'
import { hasNodeModules } from '../utils/path'
import { getPort, ServerName } from '../utils/port'
import { bin } from '../utils/bin'
import { SpanwedChild } from '../utils/spawn'

let child: SpanwedChild | null = null

export async function startServer() {
  if (child) {
    stopServer()
  }
  try {
    if (!hasNodeModules()) {
      await npmInstall()
    }

    const port = await getPort(ServerName.DCLPreview)

    console.log(`DCLPreview: preview server started on port ${port}`)

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
      console.log(`DCLDeploy: closing server with status code ${code}`)
      child = null
    })
  } catch (error) {
    console.error('Could not initialize DCLPreview server')
  }
}

export async function stopServer() {
  if (child && !child.process.killed) {
    console.log('DCLPreview: killing process')
    child.process.kill()
  }
  child = null
}
