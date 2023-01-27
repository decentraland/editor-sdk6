import * as vscode from 'vscode'
import { GLTFPreviewDocument } from './document'
import { createWebview } from './webview'

export class GLTFPreviewEditorProvider
  implements vscode.CustomReadonlyEditorProvider<GLTFPreviewDocument>
{
  public static register(disposables: vscode.Disposable[]): vscode.Disposable {
    const disposable = vscode.window.registerCustomEditorProvider(
      GLTFPreviewEditorProvider.viewType,
      new GLTFPreviewEditorProvider(),
      {
        supportsMultipleEditorsPerDocument: false,
      }
    )
    disposables.push(disposable)
    return disposable
  }

  private static readonly viewType = 'decentraland.GLTFPreview'

  //#region CustomEditorProvider

  async openCustomDocument(uri: vscode.Uri): Promise<GLTFPreviewDocument> {
    const document: GLTFPreviewDocument = await GLTFPreviewDocument.create(uri)
    return document
  }

  async resolveCustomEditor(
    document: GLTFPreviewDocument,
    panel: vscode.WebviewPanel
  ): Promise<void> {
    const webview = await createWebview(document, panel)
    await webview.load()
  }

  //#endregion
}
