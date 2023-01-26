import open = require('open')
import { getServerUrl } from '../modules/server'
import { ServerName } from '../modules/server'

export async function browser(server: ServerName, params = '') {
  const url = await getServerUrl(server)
  open(url + params)
}
