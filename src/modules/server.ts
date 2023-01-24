import vscode from 'vscode'
import fetch from 'node-fetch'
import { getPort } from './port'
import { sleep } from './sleep'
import { getLocalValue } from './storage'
import { getScene } from './workspace'

export enum ServerName {
  GLTFPreview = 'gltf-preview',
  RunScene = 'run-scene',
  PublishScene = 'publish-scene',
}

export abstract class Server {
  abstract init?(): Promise<void>
  abstract start(): Promise<void>
  abstract stop(): Promise<void>
}

/**
 * Return the url for a given server
 * @param server The name of the server
 * @returns The url of that server
 */
export async function getServerUrl(server: ServerName) {
  const port = await getPort(server)
  const url = await vscode.env.asExternalUri(
    vscode.Uri.parse(`http://localhost:${port}`)
  )
  return url.toString() + getServerParams(server)
}

/**
 * Return the params for a given server
 * @param server The name of the server
 * @returns The url of that server
 */
export function getServerParams(server: string) {
  switch (server) {
    case ServerName.RunScene:
      return `?position=${encodeURI(getScene().scene.base)}`
    case ServerName.PublishScene:
      return getLocalValue<boolean>('isWorld') ? `?skipValidations=true` : ''
    default:
      return ''
  }
}

/**
 * Waits for a server to be ready
 * @param server The name of the server
 * @returns Promise that resolves when the server is up
 */
export async function waitForServer(url: string) {
  while (true) {
    try {
      await fetch(url)
      return
    } catch (error) {
      await sleep(500)
    }
  }
}
