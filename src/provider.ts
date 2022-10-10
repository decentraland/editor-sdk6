import * as vscode from 'vscode'
import { WearablePreviewDocument } from './document'
import {
  ExtensionMessage,
  ExtensionMessagePayload,
  ExtensionMessageType,
  PreviewType,
} from './types/extension-message'
import { WebviewMessage, WebviewMessageType } from './types/webview-message'
import { getNonce } from './util'
import { WebviewCollection } from './webviews'

export class WearablePreviewEditorProvider
  implements vscode.CustomReadonlyEditorProvider<WearablePreviewDocument>
{
  public static register(context: vscode.ExtensionContext): vscode.Disposable {
    return vscode.window.registerCustomEditorProvider(
      WearablePreviewEditorProvider.viewType,
      new WearablePreviewEditorProvider(context),
      {
        supportsMultipleEditorsPerDocument: false,
      }
    )
  }

  private static readonly viewType = 'decentraland.GLTFPreview'

  /**
   * Tracks all known webviews
   */
  private readonly webviews = new WebviewCollection()

  constructor(private readonly _context: vscode.ExtensionContext) {}

  //#region CustomEditorProvider

  async openCustomDocument(
    uri: vscode.Uri,
    _openContext: { backupId?: string },
    _token: vscode.CancellationToken
  ): Promise<WearablePreviewDocument> {
    const document: WearablePreviewDocument =
      await WearablePreviewDocument.create(uri)

    return document
  }

  async resolveCustomEditor(
    document: WearablePreviewDocument,
    panel: vscode.WebviewPanel,
    _token: vscode.CancellationToken
  ): Promise<void> {
    // Add the webview to our internal set of active webviews
    this.webviews.add(document.uri, panel)

    // Setup initial content for the webview
    panel.webview.options = {
      enableScripts: true,
    }

    // Write html
    panel.webview.html = await this.getHtml(panel.webview)

    // Handle messages
    panel.webview.onDidReceiveMessage((event) =>
      this.onMessage(document, event)
    )
  }

  //#endregion

  /**
   * Get the static HTML used for in our editor's webviews.
   */
  private async getHtml(webview: vscode.Webview) {
    // iframe url
    const wearablePreviewUrl = await vscode.env.asExternalUri(
      vscode.Uri.parse(`https://wearable-preview.decentraland.org`)
    )

    // Local path to script and css for the webview
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._context.extensionUri, 'media', 'script.js')
    )
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._context.extensionUri, 'media', 'style.css')
    )

    // Use a nonce to whitelist which scripts can be run
    const nonce = getNonce()

    return /* html */ `
			<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">

				<!--
				Use a content security policy to only allow loading images from https or from our extension directory,
				and only allow scripts that have a specific nonce.
				-->
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; child-src 'self' ${wearablePreviewUrl}; img-src ${webview.cspSource} blob:; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">

				<meta name="viewport" content="width=device-width, initial-scale=1.0">

				<link href="${styleUri}" rel="stylesheet" />

				<title>Wearable Preview</title>
			</head>
			<body>
				<iframe 
          id="wearable-preview-iframe" 
          src="${wearablePreviewUrl}" 
          width="100%"
          height="100%"
          frameBorder="0"
        ></iframe>
				<script nonce="${nonce}" src="${scriptUri}"></script>
			</body>
			</html>`
  }

  private postMessage<T extends ExtensionMessageType>(
    panel: vscode.WebviewPanel,
    type: T,
    payload: ExtensionMessagePayload[T]
  ): void {
    const message: ExtensionMessage<T> = { type, payload }
    panel.webview.postMessage(message)
  }

  private onMessage(
    document: WearablePreviewDocument,
    message: WebviewMessage<WebviewMessageType>
  ) {
    switch (message.type) {
      case WebviewMessageType.READY: {
        const uri = document.uri.toString()
        const isEmote = uri.endsWith('.emote.glb')
        for (const webview of this.webviews.get(document.uri)) {
          this.postMessage(webview, ExtensionMessageType.INIT, {
            file: document.documentData,
            type: isEmote ? PreviewType.EMOTE : PreviewType.MODEL,
          })
        }
      }
    }
  }
}
