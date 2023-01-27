import * as vscode from 'vscode'
import mitt from 'mitt'
import future from 'fp-future'
import { getContext } from './context'
import { waitForServer } from './server'

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

  constructor(public url: string, public panel: vscode.WebviewPanel) {
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

  async load() {
    this.panel.webview.html = this.getLoadingHtml()
    await waitForServer(this.url)
    this.panel.webview.html = this.getIframeHtml()
  }

  async loadOrDispose() {
    const dispose = future<void>()
    this.onDispose(dispose.resolve)
    return Promise.race([this.load(), dispose])
  }

  private getLoadingHtml() {
    return this.getHtml(`<div class="loading">Loading&hellip;<div>`)
  }

  private getIframeHtml() {
    const id = getNonce()
    const nonce = getNonce()
    return this.getHtml(
      `
    <iframe 
      id="${id}" 
      src="${this.url}" 
      width="100%"
      height="100%"
      frameBorder="0"
    ></iframe>
    <script nonce="${nonce}">
      /* This is necessary to be able to find the iframe from the script.js */
      window.iframeId = "${id}";
    </script>`,
      nonce
    )
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

  private getHtml(body: string, nonce = getNonce()) {
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

    const url = new URL(this.url)
    const cspUrl = `${url.protocol}//${url.hostname}:${url.port}`

    return /* html */ `
			<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">

				<!--
				Use a content security policy to only allow loading images from https or from our extension directory,
				and only allow scripts that have a specific nonce.
				-->
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; child-src 'self' ${cspUrl}; img-src ${this.panel.webview.cspSource} blob:; style-src ${this.panel.webview.cspSource}; script-src 'nonce-${nonce}';">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<link href="${styleUri}" rel="stylesheet" />
				<title>${this.panel.title}</title>
			</head>
			<body>
				${body}
			<script nonce="${nonce}" src="${scriptUri}"></script>
			</body>
			</html>`
  }
}

/**
 * Get a nonce for a script tag or an iframe id
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
