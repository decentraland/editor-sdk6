import vscode from 'vscode'
import {
  BodyShape,
  EmoteCategory,
  EmoteWithBlobs,
  WearableCategory,
  WearableWithBlobs,
} from '@dcl/schemas'
import { getPort, ServerName } from '../../modules/port'
import { Webview, WebviewCollection } from '../../modules/webview'
import { GLTFPreviewDocument } from './document'
import {
  GLFTPreviewInboundMessagePayload,
  GLFTPreviewInboundMessageType,
  GLFTPreviewOutboundMessagePayload,
  GLFTPreviewOutboundMessageType,
} from './types'

export async function createWebview(
  document: GLTFPreviewDocument,
  panel: vscode.WebviewPanel
) {
  panel.webview.options = {
    enableScripts: true,
  }
  const port = await getPort(ServerName.GTLFPreview)
  const webview = new Webview<
    GLFTPreviewInboundMessageType,
    GLFTPreviewInboundMessagePayload,
    GLFTPreviewOutboundMessageType,
    GLFTPreviewOutboundMessagePayload
  >('gltf-preview', port!, panel)

  // Handle messages
  webview.onMessage((message) => {
    switch (message.type) {
      case GLFTPreviewOutboundMessageType.READY: {
        const uri = document.uri.toString()
        const isEmote = uri.endsWith('.emote.glb')

        // Send blob to iframe
        let blob
        let options = {}

        if (!isEmote) {
          blob = toWearableWithBlobs(document)
          options = {
            wheelZoom: 2,
            skin: '555555',
            hair: '555555',
          }
        } else {
          blob = toEmoteWithBlobs(document)
          options = {
            profile: 'default',
            skin: '555555',
            disableFace: true,
            disableDefaultWearables: true,
          }
          break
        }

        webview.postMessage(GLFTPreviewInboundMessageType.UPDATE, {
          options: {
            blob,
            disableBackground: true,
            ...options,
          },
        })
      }
    }
  })

  return webview
}

// Helpers to build wearable and emote with blobs
function toWearableWithBlobs(
  document: GLTFPreviewDocument,
  category: WearableCategory = WearableCategory.HAT
): WearableWithBlobs {
  return {
    id: 'some-id',
    name: '',
    description: '',
    image: '',
    thumbnail: '',
    i18n: [],
    data: {
      category,
      hides: [],
      replaces: [],
      tags: [],
      representations: [
        {
          bodyShapes: [BodyShape.MALE, BodyShape.FEMALE],
          mainFile: 'model.glb',
          contents: [
            {
              key: 'model.glb',
              blob: document.data,
            },
            ...document.otherFiles.map(({ key, data }) => ({
              key,
              blob: data,
            })),
          ],
          overrideHides: [],
          overrideReplaces: [],
        },
      ],
    },
  }
}

function toEmoteWithBlobs(document: GLTFPreviewDocument): EmoteWithBlobs {
  return {
    id: 'some-id',
    name: '',
    description: '',
    image: '',
    thumbnail: '',
    i18n: [],
    emoteDataADR74: {
      category: EmoteCategory.DANCE,
      tags: [],
      representations: [
        {
          bodyShapes: [BodyShape.MALE, BodyShape.FEMALE],
          mainFile: 'model.glb',
          contents: [
            {
              key: 'model.glb',
              blob: document.data,
            },
            ...document.otherFiles.map(({ key, data }) => ({
              key,
              blob: data,
            })),
          ],
        },
      ],
      loop: false,
    },
  }
}