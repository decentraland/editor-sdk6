import * as vscode from 'vscode'
import { Disposable } from './dispose'

/**
 * Define the document (the data model) used for paw draw files.
 */
export class WearablePreviewDocument
  extends Disposable
  implements vscode.CustomDocument
{
  static async create(
    uri: vscode.Uri
  ): Promise<WearablePreviewDocument | PromiseLike<WearablePreviewDocument>> {
    const fileData = await WearablePreviewDocument.readFile(uri)
    return new WearablePreviewDocument(uri, fileData)
  }

  private static async readFile(uri: vscode.Uri): Promise<Uint8Array> {
    if (uri.scheme === 'untitled') {
      return new Uint8Array()
    }
    return new Uint8Array(await vscode.workspace.fs.readFile(uri))
  }

  private readonly _uri: vscode.Uri

  private _documentData: Uint8Array

  private constructor(uri: vscode.Uri, initialContent: Uint8Array) {
    super()
    this._uri = uri
    this._documentData = initialContent
  }

  public get uri() {
    return this._uri
  }

  public get documentData(): Uint8Array {
    return this._documentData
  }

  private readonly _onDidDispose = this._register(
    new vscode.EventEmitter<void>()
  )
  /**
   * Fired when the document is disposed of.
   */
  public readonly onDidDispose = this._onDidDispose.event

  /**
   * Called by VS Code when there are no more references to the document.
   *
   * This happens when all editors for it have been closed.
   */
  dispose(): void {
    this._onDidDispose.fire()
    super.dispose()
  }
}
