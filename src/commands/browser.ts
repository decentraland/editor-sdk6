import open = require('open')
import { ServerName } from '../types'
import { getServerUrl } from '../utils'

export async function browser(server: ServerName, params = '') {
  const url = await getServerUrl(server)
  open(url + params)
}
