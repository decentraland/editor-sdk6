import { bin } from '../../modules/bin'
import { log } from '../../modules/log'
import { Server, ServerName } from '../../modules/server'
import { SpanwedChild } from '../../modules/spawn'

class PublishSceneServer extends Server {
  child: SpanwedChild | null = null
  promise: Promise<void> | null = null

  isStopping = false
  isKilled = false

  constructor() {
    super(ServerName.PublishScene)
  }

  async start(...args: string[]) {
    await this.stop()
    this.child = bin('decentraland', 'dcl', [
      'deploy',
      `--port ${await this.getPort()}`,
      `--no-browser`,
      ...args,
    ])
  }

  async stop() {
    if (!this.isStopping && this.child && this.child.alive()) {
      this.isStopping = true
      this.isKilled = true
      await this.child.kill()
      this.child = null
      this.isStopping = false
    }
  }

  async waitForPublish() {
    if (this.child && !this.isStopping) {
      return Promise.race([
        this.child.waitFor(/content uploaded/gi, /error/gi).then(() => true),
        this.child.wait().then(() => false),
      ])
    }
  }
}

export const server = new PublishSceneServer()
