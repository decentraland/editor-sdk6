import { Uri, WebviewPanel } from 'vscode'
import { getNonce, WebviewCollection } from './webviews'

let uriMock: ReturnType<typeof mockUri>
function mockUri() {
  return {
    toString: jest.fn().mockReturnValue('/path/to/file'),
  }
}

let panelMock: ReturnType<typeof mockPanel>
let disposePanel: () => void
function mockPanel() {
  return {
    onDidDispose: jest.fn().mockImplementation((cb) => (disposePanel = cb)),
  }
}

describe('webviews', () => {
  let webviews: WebviewCollection
  beforeEach(() => {
    uriMock = mockUri()
    panelMock = mockPanel()
    webviews = new WebviewCollection()
  })
  describe('When adding a webview', () => {
    beforeEach(() => {
      webviews.add(
        uriMock as unknown as Uri,
        panelMock as unknown as WebviewPanel
      )
    })
    it('should add the uri as an entry', () => {
      expect(uriMock.toString).toHaveBeenCalled()
    })
    it('should bind the webview panel onDidDispose handler', () => {
      expect(panelMock.onDidDispose).toHaveBeenCalled()
    })
    it('should be possible to get the webview from the collection using the uri', () => {
      const generator = webviews.get(uriMock as unknown as Uri) as unknown as {
        next: () => { value: WebviewPanel }
      }
      expect(generator.next().value).toBe(panelMock)
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
