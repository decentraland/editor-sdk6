import {
  BodyShape,
  EmoteCategory,
  EmoteWithBlobs,
  WearableCategory,
  WearableWithBlobs,
} from '@dcl/schemas'
import { GLTFPreviewDocument } from './document'

// Helpers to build wearable and emote with blobs

export function toWearableWithBlobs(
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

export function toEmoteWithBlobs(
  document: GLTFPreviewDocument
): EmoteWithBlobs {
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
