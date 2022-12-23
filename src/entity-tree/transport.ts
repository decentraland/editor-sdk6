import WebSocket from 'ws'
import future from 'fp-future'
import { getServerUrl, ServerName } from '../modules/port'

export async function createTransport(): Promise<any> {
  const url = await getServerUrl(ServerName.WSTransport)
  const ws = new WebSocket(url)

  return {
    type: 'websocket',
    filter() {
      return true
    },
    async send(bytes: Uint8Array) {
      const promise = future<void>()
      console.log('Sending', bytes)
      ws.send(bytes, (error) =>
        error ? promise.reject(error) : promise.resolve()
      )
      return promise
    },
  }
}
