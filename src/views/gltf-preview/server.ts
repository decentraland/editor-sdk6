import path from 'path'
import { getExtensionPath } from '../../modules/path'
import { ServerName, StaticServer } from '../../modules/server'

export const gltfPreviewServer = new StaticServer(ServerName.GLTFPreview, () =>
  path.join(
    getExtensionPath(),
    './node_modules/@dcl/wearable-preview/static-local'
  )
)
