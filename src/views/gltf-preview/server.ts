import path from 'path'
import { getExtensionPath } from '../../modules/path'
import { StaticServer } from '../../modules/server'
import { ServerName } from '../../types'

export const gltfPreviewServer = new StaticServer(ServerName.GLTFPreview, () =>
  path.join(
    getExtensionPath(),
    './node_modules/@dcl/wearable-preview/static-local'
  )
)
