import * as vscode from 'vscode'
import fetch from 'node-fetch'
import future from 'fp-future'
import net, { AddressInfo } from 'net'
import { sleep } from './sleep'
import { getScene } from './workspace'
import { getLocalValue } from './storage'

/**
 * List of all the servers
 */
export enum ServerName {
  GTLFPreview = 'gltf-preview',
  RunScene = 'run-scene',
  PublishScene = 'dcl-deploy',
  WSTransport = 'ws-transport',
}

/**
 * Maps a server name into a port
 */
const ports = new Map<ServerName, number>()

/**
 * Returns an the port for a given a server name
 */
export async function getPort(server: ServerName) {
  if (!ports.has(server)) {
    const port = await getAvailablePort()
    ports.set(server, port)
  }
  return ports.get(server)
}

/**
 * Clears the port saved for a given server name
 */
export function clearPort(server: ServerName) {
  if (ports.has(server)) {
    ports.delete(server)
  }
}

/**
 * Returns a promise that resolves to an available TCP port
 */
async function getAvailablePort() {
  const promise = future<number>()
  const server = net.createServer()
  server.unref()
  server.on('error', promise.reject)
  server.listen(() => {
    const { port } = server.address() as AddressInfo
    server.close(() => {
      promise.resolve(port)
    })
  })
  return promise
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
  return url.toString()
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
