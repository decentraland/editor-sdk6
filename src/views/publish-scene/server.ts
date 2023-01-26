import { bin } from '../../modules/bin'
import { Server } from '../../modules/server'
import { SpanwedChild } from '../../modules/spawn'
import { ServerName } from '../../types'

class PublishSceneServer extends Server {
  child: SpanwedChild | null = null

  constructor() {
    super(ServerName.PublishScene)
  }

  async onStart(...args: string[]) {
    this.child = bin('decentraland', 'dcl', [
      'deploy',
      `--port ${await this.getPort()}`,
      `--no-browser`,
      ...args,
    ])
  }

  async onStop() {
    if (this.child && this.child.alive()) {
      await this.child.kill()
      this.child = null
    }
  }

  async waitForPublish() {
    if (this.child && !this.isStopping) {
      const success = await Promise.race([
        this.child.waitFor(/content uploaded/gi, /error/gi).then(() => true),
        this.child.wait().then(() => false),
      ])
      /* 
        Success will be true only if the deployment is successful. 
        If there is an error, this method will throw. 
        If there are no errors, but the process exits gracefully, it will not throw, but the success flag will be false
      */
      return success
    }
  }
}

export const publishSceneServer = new PublishSceneServer()
