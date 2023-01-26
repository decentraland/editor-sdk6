import { ExtensionContext, Uri, WebviewPanel } from 'vscode'
import { getNonce, Webview } from './webview'

/********************************************************
                          Mocks
*********************************************************/

import { getContext } from './context'
jest.mock('./context')
const getContextMock = getContext as jest.MockedFunction<typeof getContext>

let disposePanel: () => void
let sendMessage: (message: any) => void
const mockPanel = (title = 'Decentraland') => {
  return {
    title,
    webview: {
      html: '',
      asWebviewUri: jest.fn().mockImplementation((value: any) => value),
      onDidReceiveMessage: jest
        .fn()
        .mockImplementation((handler: (event: any) => void) => {
          sendMessage = handler
        }),
    },
    onDidDispose: jest.fn().mockImplementation((cb: () => void) => {
      disposePanel = cb
    }),
    dispose: jest.fn().mockImplementation(() => disposePanel()),
    postMessage: jest.fn(),
  }
}

/********************************************************
                          Tests
*********************************************************/

describe('webviews', () => {
  let panelMock: ReturnType<typeof mockPanel>
  beforeEach(() => {
    panelMock = mockPanel()
    getContextMock.mockReturnValue({
      extensionUri: '/path/to/extension' as unknown as Uri,
    } as unknown as ExtensionContext)
  })
  describe('When using a webview', () => {
    let webview: Webview
    beforeEach(() => {
      webview = new Webview(
        'http://google.com',
        panelMock as unknown as WebviewPanel
      )
    })
    it('should', async () => {
      await webview.load()
    })
  })
  describe('When getting a nonce', () => {
    it('should return a 32 chars long string made of letters and numbers', () => {
      expect(getNonce()).toMatch(/[A-z0-9]{32}/)
    })
  })
})
