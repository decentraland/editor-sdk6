import * as vscode from 'vscode'
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
    const mainFile = await GLTFPreviewDocument.readFile(uri)
    const folder = path.dirname(uri.fsPath)
    const filePaths = getFilePaths(folder)
    /*
      Other files means all the files in the same directory or subdirectories. They might be needed if the main reads other files (like a GLB that loads an external texture).
    */
    const otherFiles = await Promise.all(filePaths
      // filter out the main file
      .filter(filePath => uri.fsPath !== filePath)
      .map(async (filePath) => {
        return {
          key: path.relative(folder, filePath),
          data: await GLTFPreviewDocument.readFile(vscode.Uri.file(filePath))
        }
      }))
    return new GLTFPreviewDocument(uri, mainFile, otherFiles)
  }

  private static async readFile(uri: vscode.Uri): Promise<Uint8Array> {
    if (uri.scheme === 'untitled') {
      return new Uint8Array()
    }
    return new Uint8Array(await vscode.workspace.fs.readFile(uri))
  }


  constructor(
    public uri: vscode.Uri,
    public data: Uint8Array,
    public otherFiles: { key: string, data: Uint8Array }[]
  ) {
    super()
  }

  // Disposable
  private readonly _onDidDispose = this._register(
    new vscode.EventEmitter<void>()
  )
  public readonly onDidDispose = this._onDidDispose.event
  dispose(): void {
    this._onDidDispose.fire()
    super.dispose()
  }
}
