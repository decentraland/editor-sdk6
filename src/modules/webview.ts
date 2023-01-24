import * as vscode from 'vscode'
import mitt from 'mitt'
import { getContext } from './context'
import { getServerUrl, ServerName, waitForServer } from './server'
import { getPort } from './port'

export type Message<
  MessageType extends string,
  MessagePayload extends Record<MessageType, unknown>
> = {
  type: MessageType
  payload: MessagePayload[MessageType]
}

export class Webview<
  InboundMessageType extends string = never,
  InboundMessagePayload extends Record<InboundMessageType, unknown> = never,
  OutboundMessageType extends string = never,
  OutboundMessagePayload extends Record<OutboundMessageType, unknown> = never
> {
  private events = mitt<{
    message: Message<OutboundMessageType, OutboundMessagePayload>
    dispose: any
  }>()

  didDispose = false

  constructor(public server: ServerName, public panel: vscode.WebviewPanel) {
    this.panel.webview.onDidReceiveMessage((event: unknown) => {
      if (event && 'type' in event && 'payload' in event) {
        const message = event as Message<
          OutboundMessageType,
          OutboundMessagePayload
        >
        this.events.emit('message', message)
      }
    })
    this.panel.onDidDispose(() => {
      this.events.emit('dispose')
    })
    this.events.on('dispose', () => {
      this.didDispose = true
    })
  }

  async getPort() {
    const port = await getPort(this.server)
    return port
  }

  async getUrl() {
    const url = await getServerUrl(this.server)
    return url
  }

  async load() {
    this.panel.webview.html = await this.getLoadingHtml()
    const uri = await this.getUrl()
    await waitForServer(uri.toString())
    this.panel.webview.html = await this.getIframeHtml()
  }

  private getLoadingHtml() {
    return this.getHtml(true)
  }

  private getIframeHtml() {
    return this.getHtml(false)
  }

  dispose() {
    if (!this.didDispose) {
      this.panel.dispose()
    }
  }

  onDispose(handler: () => void) {
    return this.events.on('dispose', handler)
  }

  onMessage(
    handler: (
      message: Message<OutboundMessageType, OutboundMessagePayload>
    ) => void
  ) {
    return this.events.on('message', handler)
  }

  postMessage(
    type: InboundMessageType,
    payload: InboundMessagePayload[InboundMessageType]
  ): void {
    const message: Message<InboundMessageType, InboundMessagePayload> = {
      type,
      payload,
    }
    this.panel.webview.postMessage(message)
  }

  private async getHtml(isLoading: boolean) {
    // iframe url
    const url = await this.getUrl()

    // resources
    const resourcesDirectory = 'resources/webview'

    // Local path to script and css for the webview
    const scriptUri = this.panel.webview.asWebviewUri(
      vscode.Uri.joinPath(
        getContext().extensionUri,
        resourcesDirectory,
        'script.js'
      )
    )
    const styleUri = this.panel.webview.asWebviewUri(
      vscode.Uri.joinPath(
        getContext().extensionUri,
        resourcesDirectory,
        'style.css'
      )
    )

    // Use a nonce to whitelist which scripts can be run
    const nonce = getNonce()

    const iframeUrl = new URL(url.toString())
    const cspUrl = `${iframeUrl.protocol}//${iframeUrl.hostname}:${iframeUrl.port}`

    return /* html */ `
			<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">

				<!--
				Use a content security policy to only allow loading images from https or from our extension directory,
				and only allow scripts that have a specific nonce.
				-->
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; child-src 'self' ${cspUrl}; img-src ${
      this.panel.webview.cspSource
    } blob:; style-src ${
      this.panel.webview.cspSource
    }; script-src 'nonce-${nonce}';">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<link href="${styleUri}" rel="stylesheet" />
				<title>${this.panel.title}</title>
			</head>
			<body>
				${
          isLoading
            ? '<div class="loading">Loading&hellip;<div>'
            : `<iframe 
          id="${this.server}" 
          src="${url}" 
          width="100%"
          height="100%"
          frameBorder="0"
        ></iframe>`
        }
      <script nonce="${nonce}">
        /* This is necessary to be able to find the iframe from the script.js below */
        window.iframeId = "${this.server}";
      </script>
			<script nonce="${nonce}" src="${scriptUri}"></script>
			</body>
			</html>`
  }
}

/**
 * Get a nonce for a script tag
 */
export function getNonce() {
  let text = ''
  const possible =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length))
  }
  return text
}
