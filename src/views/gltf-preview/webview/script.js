// This script is run within the webview itself
;(function () {
  // @ts-ignore
  const vscode = acquireVsCodeApi()

  // Wearable Preview iframe
  const iframe = document.getElementById('wearable-preview-iframe')

  // Send messages
  function sendMessage(target, type, payload = {}) {
    const message = { type, payload }
    target.postMessage(message, '*')
  }

  // Handle messages from iframe
  window.addEventListener('message', async (event) => {
    const { type, payload } = event.data
    switch (type) {
      case 'ready': {
        // Tell the extension that the iframe is ready
        sendMessage(vscode, 'ready')
        break
      }
      case 'init': {
        // Send blob to iframe
        let blob
        let options = {}
        const file = new Blob([payload.file], { type: 'model/gltf-binary' })
        const otherFiles = payload.otherFiles.map((file) => ({
          key: file.name,
          blob: new Blob([file.data]),
        }))

        switch (payload.type) {
          case 'model': {
            blob = toWearableWithBlobs(file, otherFiles)
            options = {
              wheelZoom: 2,
              skin: '555555',
              hair: '555555',
            }
            break
          }
          case 'emote': {
            blob = toEmoteWithBlobs(file, otherFiles)
            options = {
              profile: 'default',
              skin: '555555',
              disableFace: true,
              disableDefaultWearables: true,
            }
            break
          }
        }

        sendMessage(iframe.contentWindow, 'update', {
          options: {
            blob,
            disableBackground: true,
            ...options,
          },
        })
        break
      }
    }
  })

  // Helpers to build wearable and emote with blobs
  function toWearableWithBlobs(file, otherFiles = [], category = 'hat') {
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
            bodyShapes: [
              'urn:decentraland:off-chain:base-avatars:BaseMale',
              'urn:decentraland:off-chain:base-avatars:BaseFemale',
            ],
            mainFile: 'model.glb',
            contents: [
              {
                key: 'model.glb',
                blob: file,
              },
              ...otherFiles,
            ],
            overrideHides: [],
            overrideReplaces: [],
          },
        ],
      },
    }
  }

  function toEmoteWithBlobs(file, otherFiles = []) {
    return {
      id: 'some-id',
      name: '',
      description: '',
      image: '',
      thumbnail: '',
      i18n: [],
      emoteDataADR74: {
        category: 'dance',
        tags: [],
        representations: [
          {
            bodyShapes: [
              'urn:decentraland:off-chain:base-avatars:BaseMale',
              'urn:decentraland:off-chain:base-avatars:BaseFemale',
            ],
            mainFile: 'model.glb',
            contents: [
              {
                key: 'model.glb',
                blob: file,
              },
              ...otherFiles,
            ],
          },
        ],
        loop: false,
      },
    }
  }
})()
