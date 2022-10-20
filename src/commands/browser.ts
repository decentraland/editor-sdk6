import open = require('open')
import { getServerUrl, ServerName } from '../utils/port'

export async function browser() {
  const url = await getServerUrl(ServerName.DCLPreview)
  open(url.toString())
}
