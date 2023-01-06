import WebSocket from 'ws'
import { Transport } from '@dcl/sdk/ecs'
import { getPort, ServerName } from '../modules/port'

export async function createTransport(id: string): Promise<Transport> {
  const port = await getPort(ServerName.WSTransport)
  const ws = new WebSocket(`ws://localhost:${port}/ws`)

  ws.on('open', open)
  ws.on('message', handleMessage)

  let isOpen = false
  let queue: Uint8Array[] = []

  function open() {
    isOpen = true
    if (queue.length > 0) {
      for (const message of queue) {
        send(message)
      }
    }
  }

  async function send(bytes: Uint8Array) {
    if (isOpen) {
      console.log(`sent(transport=${id})`, bytes.length, 'bytes')
      ws.send(bytes, (error) => {
        if (error) {
          console.error(error)
        }
      })
    } else {
      queue.push(bytes)
    }
  }

  function handleMessage(data: Buffer) {
    console.log(`received(transport=${id})`, data.length, 'bytes')
    if (transport.onmessage) {
      if (Array.isArray(data)) {
        for (const item of data) {
          transport.onmessage(new Uint8Array(item))
        }
      } else {
        transport.onmessage(new Uint8Array(data))
      }
    }
  }

  const transport: Transport = {
    filter() {
      return true
    },
    send,
  }

  return transport
}
