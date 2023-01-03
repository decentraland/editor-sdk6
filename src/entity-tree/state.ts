import { getPort, ServerName, waitForServer } from '../modules/port'
import { createTransport } from './transport'

export async function testTransport() {
  console.log('testing transport')
  const port = await getPort(ServerName.WSTransport)
  const url = `http://localhost:${port}`
  await waitForServer(url)
  const transportA = await createTransport()
  const transportB = await createTransport()
  transportB.onmessage = function (msg) {
    console.log(
      'got message on transport B:',
      Buffer.from(msg.buffer).toString('utf-8')
    )
  }
  transportA.onmessage = function (msg) {
    console.log(
      'got message on transport A:',
      Buffer.from(msg.buffer).toString('utf-8')
    )
  }
  await transportA.send(new Uint8Array(Buffer.from('holan from A', 'utf-8')))
  await transportB.send(new Uint8Array(Buffer.from('holan from B', 'utf-8')))
}
