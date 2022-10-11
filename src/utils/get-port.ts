import future from 'fp-future'
import net, { AddressInfo } from 'net'

export enum ServerName {
  GTLFPreview = 'gltf-preview',
}

const ports = new Map<ServerName, number>()

export async function getPort(server: ServerName) {
  if (!ports.has(server)) {
    const port = await getAvailablePort()
    ports.set(server, port)
  }
  return ports.get(server)
}

export function clearPort(server: ServerName) {
  if (ports.has(server)) {
    ports.delete(server)
  }
}

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
