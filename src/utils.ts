import { env, Uri } from 'vscode'
import { getPort } from './modules/port'
import { getLocalValue } from './modules/storage'
import { getScene } from './modules/workspace'
import { ServerName } from './types'

/**
 * Return the url for a given server
 * @param server The name of the server
 * @returns The url of that server
 */
export async function getServerUrl(server: ServerName) {
  const hasLocalServer = process.env.LOCAL_DEV_SERVER === server
  const port = hasLocalServer
    ? Number(process.env.LOCAL_DEV_PORT || 3000)
    : await getPort(server)
  const url = await env.asExternalUri(Uri.parse(`http://localhost:${port}`))
  return url.toString() + getServerParams(server)
}

/**
 * Return the params for a given server
 * @param server The name of the server
 * @returns The url of that server
 */

export function getServerParams(server: ServerName) {
  switch (server) {
    case ServerName.RunScene:
      return `?position=${encodeURI(getScene().scene.base)}`
    case ServerName.PublishScene:
      return getLocalValue<boolean>('isWorld') ? `?skipValidations=true` : ''
    default:
      return ''
  }
}
