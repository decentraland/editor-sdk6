import path from 'path'
import { getExtensionPath } from '../../modules/path'
import { StaticServer } from '../../modules/server'
import { ServerName } from '../../types'

export const inspectorServer = new StaticServer(ServerName.Inspector, () =>
  path.join(
    getExtensionPath(),
    './node_modules/@dcl/inspector/build'
  )
)
