import vscode from 'vscode'
import fetch from 'node-fetch'
import { getPort } from './port'
import { sleep } from './sleep'
import { getLocalValue } from './storage'
import { getScene } from './workspace'
import { log } from './log'
import { getMessage } from './error'

export enum ServerName {
  GLTFPreview = 'GLTFPreview',
  RunScene = 'RunScene',
  PublishScene = 'PublishScene',
}

export abstract class Server {
  constructor(public name: ServerName) {}

  isStarting = false
  isStopping = false
  isRunning = false

  async getPort() {
    return getPort(this.name)
  }

  async start(...args: any[]) {
    try {
      await this.stop()
      if (this.isStarting) {
        return
      }
      this.isStarting = true
      await this.onStart(...args)
      this.isStarting = false
      this.isRunning = true
      log(`${this.name} server started on port=${await this.getPort()}`)
    } catch (error) {
      this.isStarting = false
      log(`Error starting ${this.name} server: ${getMessage(error)}`)
    }
  }

  async stop() {
    try {
      if (this.isStopping || !this.isRunning) {
        return
      }
      this.isStopping = true
      await this.onStop()
      this.isStopping = false
      this.isRunning = false
      log(`${this.name} server stopped`)
    } catch (error) {
      this.isStopping = false
      log(`Error stopping ${this.name} server: ${getMessage(error)}`)
    }
  }

  async restart() {
    await this.stop()
    await this.start()
  }

  abstract onStart(...args: any[]): Promise<void>
  abstract onStop(): Promise<void>
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
