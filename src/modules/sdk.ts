import { log } from './log'
import { npmInstall } from './npm'
import { getPackageVersion } from './pkg'

export async function syncSdkVersion() {
  const extensionSdkVersion = getPackageVersion('@dcl/sdk')
  const workspaceSdkVersion = getPackageVersion('@dcl/sdk', true)
  if (!workspaceSdkVersion) {
    // no need to sync if the workspace does not have a dependency on @dcl/sdk
    return
  }
  if (extensionSdkVersion !== workspaceSdkVersion) {
    log(`Extension @dcl/sdk version: ${extensionSdkVersion}`)
    log(`Workspace @dcl/sdk version: ${workspaceSdkVersion}`)
    log(
      `Workspace @dcl/sdk version is different than the extension\'s, installing @dcl/sdk@${extensionSdkVersion} into workspace...`
    )
    await npmInstall(`@dcl/sdk@${extensionSdkVersion}`)
  }
  log(`Workspace @dcl/sdk version is up to date`)
}
