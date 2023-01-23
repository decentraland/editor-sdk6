import { Uri, WebviewPanel } from 'vscode'
import { Webview, WebviewCollection } from './webview'

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


let uriMock: ReturnType<typeof mockUri>
function mockUri() {
  return {
    toString: jest.fn().mockReturnValue('/path/to/file'),
  }
}

let webviewMock: ReturnType<typeof mockWebview>
let disposePanel: () => void
function mockWebview() {
  return {
    onDispose: jest.fn().mockImplementation((cb) => (disposePanel = cb)),
  }
}

describe('webviews', () => {
  let webviews: WebviewCollection
  beforeEach(() => {
    uriMock = mockUri()
    webviewMock = mockWebview()
    webviews = new WebviewCollection()
  })
  describe('When adding a webview', () => {
    beforeEach(() => {
      webviews.add(
        uriMock as unknown as Uri,
        webviewMock as unknown as Webview
      )
    })
    it('should add the uri as an entry', () => {
      expect(uriMock.toString).toHaveBeenCalled()
    })
    it('should bind the webview panel onDidDispose handler', () => {
      expect(webviewMock.onDispose).toHaveBeenCalled()
    })
    it('should be possible to get the webview from the collection using the uri', () => {
      const generator = webviews.get(uriMock as unknown as Uri) as unknown as {
        next: () => { value: WebviewPanel }
      }
      expect(generator.next().value).toBe(webviewMock)
    })
    it('should remove the webview from the collection when the panel is disposed', () => {
      disposePanel()
      const generator = webviews.get(uriMock as unknown as Uri) as unknown as {
        next: () => { value: WebviewPanel }
      }
      expect(generator.next().value).toBe(undefined)
    })
  })
  describe('When getting a nonce', () => {
    it('should return a 32 chars long string made of letters and numbers', () => {
      expect(getNonce()).toMatch(/[A-z0-9]{32}/)
    })
  })
})
