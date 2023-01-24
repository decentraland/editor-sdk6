import open = require('open')
import { getServerUrl, ServerName } from '../modules/server'

export async function browser(server: ServerName, params = '') {
  const url = await getServerUrl(server)
  open(url + params)
}
