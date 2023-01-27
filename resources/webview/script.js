// This script is run within the webview itself, it allows to send messages to and from the iframe and the extension
;(function () {
  // @ts-ignore
  const vscode = acquireVsCodeApi()

  // Get the iframe
  const iframe = document.getElementById(window.iframeId)

  // Helper to send messages
  function sendMessage(target, type, payload = {}, origin = '*') {
    const message = { type, payload }
    target.postMessage(message, origin)
  }

  // Helper to get the target
  function getTarget(event) {
    // Message from iframe -> extension
    if (iframe.src.startsWith(event.origin)) {
      return 'extension'
    }
    // Message from extension -> iframe
    if (event.origin.startsWith('vscode-webview://')) {
      return 'iframe'
    }
  }

  // Helper to mutate all Uint8Arrays into Blobs
  function convertUint8ArraysToBlobs(payload) {
    for (const key in payload) {
      if (payload[key] instanceof Uint8Array) {
        payload[key] = new Blob([payload[key]])
      } else if (payload[key] && typeof payload[key] === 'object') {
        convertUint8ArraysToBlobs(payload[key])
      }
    }
  }

  // Handle messages from iframe/extension
  window.addEventListener('message', async (event) => {
    const { type, payload, origin } = event.data

    const target = getTarget(event)

    console.log('Target:', target)
    console.log('Message:', event.data)

    switch (target) {
      case 'extension': {
        // Send a message from the iframe to the extension
        sendMessage(vscode, type, payload, origin)
        break
      }
      case 'iframe': {
        // Convert Uint8Array -> Blob
        convertUint8ArraysToBlobs(payload)
        // Send a message from the extension to the iframe
        sendMessage(iframe.contentWindow, type, payload, origin)
        break
      }
    }
  })
})()
