import fs from 'fs'
import path from 'path'
import { track } from './analytics'
import { bin, link } from './bin'
import { loader } from './loader'
import { log } from './log'
import { getExtensionPath } from './path'
import { getPackageVersion } from './pkg'
import { getCwd } from './workspace'

const binaires = ['build-ecs', 'rollup']

export async function linkSdk() {
  const extensionSdkPath = path.resolve(
    getExtensionPath(),
    'node_modules/@dcl/sdk'
  )
  const workspaceSdkPath = path.resolve(getCwd(), 'node_modules/@dcl/sdk')

  // check if sdk is installed in workspace but not linked
  const exists = fs.existsSync(workspaceSdkPath)
  const stats = fs.lstatSync(workspaceSdkPath)
  const isSymlink = stats.isSymbolicLink()
  if (exists) {
    if (!isSymlink) {
      return await loader(`Linking SDK...`, async () => {
        const extensionSdkVersion = getPackageVersion('@dcl/sdk')
        log(`Extension SDK version: ${extensionSdkVersion}`)
        const workspaceSdkVersion = getPackageVersion('@dcl/sdk', true)
        log(`Workspace SDK version: ${workspaceSdkVersion}`)
        // link editor's sdk
        log('Linking SDK from extension...')
        await bin('npm', 'npm', ['link'], { cwd: extensionSdkPath }).wait()
        // link workspace's sdk to editor's
        log('Linking SDK onto workspace...')
        await bin('npm', 'npm', ['link @dcl/sdk']).wait()
        // copy necessary files from .bin
        log('Linking SDK binaries...')
        for (const binary of binaires) {
          const cmdPath = path.resolve(getCwd(), 'node_modules/.bin', binary)
          const binPath = path.resolve(
            getExtensionPath(),
            'node_modules/.bin',
            binary
          )
          await link(cmdPath, binPath)
        }
        log('Done!')
        // track
        track(`sdk.link`)
      })
    } else {
      log('SDK is linked!')
    }
  }
}
