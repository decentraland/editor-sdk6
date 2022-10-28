import * as vscode from 'vscode'
import { GLTFPreviewDocument } from './document'
import {
  GLFTPreviewExtensionMessage,
  GLFTPreviewExtensionMessagePayload,
  GLFTPreviewExtensionMessageType,
  GLTFPreviewType,
} from './types/extension-message'
import {
  GLFTPreviewWebviewMessage,
  GLFTPreviewWebviewMessageType,
} from './types/webview-message'
import { WebviewCollection, getNonce } from '../utils/webviews'
import { getPort, ServerName } from '../utils/port'

export class GLTFPreviewEditorProvider
  implements vscode.CustomReadonlyEditorProvider<GLTFPreviewDocument>
{
  public static register(context: vscode.ExtensionContext): vscode.Disposable {
    return vscode.window.registerCustomEditorProvider(
      GLTFPreviewEditorProvider.viewType,
      new GLTFPreviewEditorProvider(context),
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
  ): Promise<GLTFPreviewDocument> {
    const document: GLTFPreviewDocument = await GLTFPreviewDocument.create(uri)

    return document
  }

  async resolveCustomEditor(
    document: GLTFPreviewDocument,
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
    const port = await getPort(ServerName.GTLFPreview)
    const GLTFPreviewUrl = await vscode.env.asExternalUri(
      vscode.Uri.parse(`http://localhost:${port}`)
    )

    // files
    const webviewDirectory = 'src/gltf-preview/webview'

    // Local path to script and css for the webview
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this._context.extensionUri,
        webviewDirectory,
        'script.js'
      )
    )
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this._context.extensionUri,
        webviewDirectory,
        'style.css'
      )
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
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; child-src 'self' ${GLTFPreviewUrl}; img-src ${webview.cspSource} blob:; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">

				<meta name="viewport" content="width=device-width, initial-scale=1.0">

				<link href="${styleUri}" rel="stylesheet" />

				<title>Wearable Preview</title>
			</head>
			<body>
				<iframe 
          id="wearable-preview-iframe" 
          src="${GLTFPreviewUrl}" 
          width="100%"
          height="100%"
          frameBorder="0"
        ></iframe>
				<script nonce="${nonce}" src="${scriptUri}"></script>
			</body>
			</html>`
  }

  private postMessage<T extends GLFTPreviewExtensionMessageType>(
    panel: vscode.WebviewPanel,
    type: T,
    payload: GLFTPreviewExtensionMessagePayload[T]
  ): void {
    const message: GLFTPreviewExtensionMessage<T> = { type, payload }
    panel.webview.postMessage(message)
  }

  private onMessage(
    document: GLTFPreviewDocument,
    message: GLFTPreviewWebviewMessage<GLFTPreviewWebviewMessageType>
  ) {
    switch (message.type) {
      case GLFTPreviewWebviewMessageType.READY: {
        const uri = document.uri.toString()
        const isEmote = uri.endsWith('.emote.glb')
        for (const webview of this.webviews.get(document.uri)) {
          this.postMessage(webview, GLFTPreviewExtensionMessageType.INIT, {
            file: document.documentData,
            type: isEmote ? GLTFPreviewType.EMOTE : GLTFPreviewType.MODEL,
          })
        }
      }
    }
  }
}
