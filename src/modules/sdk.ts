import { log } from './log'
import { npmInstall } from './npm'
import { getPackageVersion } from './pkg'

export async function syncSdkVersion() {
  const extensionSdkVersion = getPackageVersion('@dcl/sdk')
  log(`Extension SDK version: ${extensionSdkVersion}`)
  const workspaceSdkVersion = getPackageVersion('@dcl/sdk', true)
  log(`Workspace SDK version: ${workspaceSdkVersion}`)
  if (extensionSdkVersion !== workspaceSdkVersion) {
    log(
      `Workspace SDK version is different than the extension\'s, installing @dcl/sdk@${extensionSdkVersion} into workspace...`
    )
    await npmInstall(`@dcl/sdk@${extensionSdkVersion}`)
  }
  log(`Workspace SDK version is up to date`)
}
