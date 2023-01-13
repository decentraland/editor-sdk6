import * as vscode from 'vscode'
import fs from 'fs'
import path from 'path'
import { Disposable } from '../../modules/dispose'
import { getFilePaths } from '../../modules/path'

/**
 * Define the document (the data model) used for paw draw files.
 */
export class GLTFPreviewDocument
  extends Disposable
  implements vscode.CustomDocument {
  static async create(
    uri: vscode.Uri
  ): Promise<GLTFPreviewDocument | PromiseLike<GLTFPreviewDocument>> {
    const fileData = await GLTFPreviewDocument.readFile(uri)
    const folder = path.dirname(uri.fsPath)
    const filePaths = getFilePaths(folder)
    const otherFiles = await Promise.all(filePaths
      // filter out the main file
      .filter(filePath => uri.fsPath !== filePath)
      .map(async (filePath) => {
        return {
          name: path.basename(filePath),
          data: await GLTFPreviewDocument.readFile(vscode.Uri.file(filePath))
        }
      }))
    return new GLTFPreviewDocument(uri, fileData, otherFiles)
  }

  private static async readFile(uri: vscode.Uri): Promise<Uint8Array> {
    if (uri.scheme === 'untitled') {
      return new Uint8Array()
    }
    return new Uint8Array(await vscode.workspace.fs.readFile(uri))
  }

  private readonly _uri: vscode.Uri

  private _documentData: Uint8Array

  private _otherFiles: { name: string, data: Uint8Array }[]

  private constructor(uri: vscode.Uri, initialContent: Uint8Array, otherFiles: { name: string, data: Uint8Array }[]) {
    super()
    this._uri = uri
    this._documentData = initialContent
    this._otherFiles = otherFiles
  }

  public get uri() {
    return this._uri
  }

  public get documentData(): Uint8Array {
    return this._documentData
  }

  public get otherFiles(): { name: string, data: Uint8Array }[] {
    return this._otherFiles
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
