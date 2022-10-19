import open = require('open')
import { getServerUrl } from '../dcl-preview/server'

export async function browser() {
  const url = await getServerUrl()
  open(url.toString())
}
