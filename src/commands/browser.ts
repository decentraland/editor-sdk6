import open = require('open')
import { getServerParams, getServerUrl, ServerName } from '../modules/port'

export async function browser(server: ServerName) {
  const url = await getServerUrl(server)
  const params = getServerParams(server)
  open(url.toString() + params)
}
