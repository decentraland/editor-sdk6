import http from 'http'
import fetch from 'node-fetch'
import express from 'express'
import future from 'fp-future'
import { clearPort, getPort } from './port'
import { sleep } from './sleep'
import { log } from './log'
import { getMessage } from './error'

export abstract class Server {
  constructor(public name: string) {}

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
      clearPort(this.name)
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

export class StaticServer extends Server {
  public app = express()
  server: http.Server | null = null
  private isRouted = false

  constructor(public name: string, public directory: string | (() => string)) {
    super(name)
  }

  async onStart() {
    if (!this.isRouted) {
      this.app.use(
        express.static(
          typeof this.directory === 'function'
            ? this.directory()
            : this.directory
        )
      )
      this.isRouted = true
    }
    const port = await this.getPort()
    const promise = future<void>()
    this.server = this.app.listen(port, promise.resolve)
    return promise
  }

  async onStop() {
    if (this.server) {
      this.server.close()
      this.server = null
    }
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
