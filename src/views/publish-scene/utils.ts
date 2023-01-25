import { getScene } from '../../modules/workspace'

export function validateWorldConfiguration() {
  const scene = getScene()
  if (!scene.worldConfiguration) {
    throw new Error(
      'You need to add a "worldConfiguration" section to your scene.json'
    )
  }
  if (!scene.worldConfiguration.name) {
    throw new Error(
      'You need to add a "name" property to the "worldConfiguration" section in your scene.json'
    )
  }
  if (!scene.worldConfiguration.name.endsWith('.dcl.eth')) {
    throw new Error(
      'The name of your world in your scene.json must end with ".dcl.eth"'
    )
  }
}

export function getSceneLink(isWorld: boolean) {
  const scene = getScene()
  if (isWorld && scene.worldConfiguration) {
    return `https://play.decentraland.org?realm=${scene.worldConfiguration.name}`
  } else {
    return `https://play.decentraland.org?position=${scene.scene.base}`
  }
}

export function handleDeploymentError(error: string) {
  if (/address does not have access/gi.test(error)) {
    throw new Error(
      "You don't have permission to publish on the parcels selected"
    )
  }
  if (/not have permission to deploy under/gi.test(error)) {
    const name = error.match(/under \"((\d|\w|\.)+)\"/)![1]
    throw new Error(
      `You don't have permission to publish under the name "${name}".`
    )
  } else {
    throw new Error(error)
  }
}
