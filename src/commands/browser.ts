import open = require('open')
import { getServerUrl, ServerName } from '../utils/port'

export async function browser(server: ServerName) {
  const url = await getServerUrl(server)
  open(url.toString())
}
