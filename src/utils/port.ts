import future from 'fp-future'
import net, { AddressInfo } from 'net'

/**
 * List of all the servers
 */
export enum ServerName {
  GTLFPreview = 'gltf-preview',
}

/**
 * Maps a server name into a port
 */
const ports = new Map<ServerName, number>()

/**
 * Returns an the port for a given a server name
 */
export async function getPort(server: ServerName) {
  if (!ports.has(server)) {
    const port = await getAvailablePort()
    ports.set(server, port)
  }
  return ports.get(server)
}

/**
 * Clears the port saved for a given server name
 */
export function clearPort(server: ServerName) {
  if (ports.has(server)) {
    ports.delete(server)
  }
}

/**
 * Returns a promise that resolves to an available TCP port
 */
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
