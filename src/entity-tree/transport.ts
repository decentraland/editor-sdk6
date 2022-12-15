import { Transport } from '@dcl/sdk/ecs'

interface SafeTransport implements Transport extends EventEn {

}

interface IChannel {
  postMessage(message: any, targetOrigin: string)
}

export function createTransport(channel: IChannel): Transport {
  return {
    async send(bytes) {
      vscode.
    },
  }
}
