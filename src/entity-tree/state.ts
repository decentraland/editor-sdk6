import { ServerName, waitForServer } from '../modules/port'
import { createTransport } from './transport'

export async function testTransport() {
  await waitForServer(ServerName.WSTransport)
  const transport = await createTransport()
  transport.send(new Uint8Array(Buffer.from('sabe').buffer))
}

testTransport().catch(console.error)
