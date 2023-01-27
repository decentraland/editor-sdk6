import { ExtensionContext, Uri, WebviewPanel } from 'vscode'
import { getNonce, Webview } from './webview'

/********************************************************
                          Mocks
*********************************************************/

import { getContext } from './context'
jest.mock('./context')
const getContextMock = getContext as jest.MockedFunction<typeof getContext>

import { waitForServer } from './server'
import future, { IFuture } from 'fp-future'
jest.mock('./server')
const waitForServerMock = waitForServer as jest.MockedFunction<
  typeof waitForServer
>

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
      postMessage: jest.fn(),
    },
    onDidDispose: jest.fn().mockImplementation((cb: () => void) => {
      disposePanel = cb
    }),
    dispose: jest.fn().mockImplementation(() => disposePanel()),
  }
}

enum RequestType {
  REQUEST = 'request',
}
type RequestPayload = {
  [RequestType.REQUEST]: {
    message: string
  }
}
enum ResponseType {
  RESPONSE = 'response',
}
type ResponsePayload = {
  [ResponseType.RESPONSE]: {
    message: string
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
    let webview: Webview<
      RequestType,
      RequestPayload,
      ResponseType,
      ResponsePayload
    >
    beforeEach(() => {
      webview = new Webview(
        'http://google.com',
        panelMock as unknown as WebviewPanel
      )
    })
    describe('and waiting for the content to load', () => {
      let promise: IFuture<void>
      beforeEach(() => {
        promise = future<void>()
        waitForServerMock.mockResolvedValueOnce(promise)
      })
      afterEach(() => {
        waitForServerMock.mockReset()
      })

      it('should show a loading screen while the server is not ready', async () => {
        webview.load()
        expect(webview.panel.webview.html).toMatch(/loading/gi)
        promise.resolve()
      })
      it('should show the iframe once the server is ready', async () => {
        const load = webview.load()
        promise.resolve()
        await load
        expect(webview.panel.webview.html).toMatch(/iframe/gi)
      })
      describe('and also waiting for it to be disposed', () => {
        it('should resolve if it is disposed before the content is loaded', () => {
          const loadOrDispose = webview.loadOrDispose()
          webview.dispose()
          expect(loadOrDispose).resolves.toBe(void 0)
        })
      })
    })
    describe('and disposing it', () => {
      it('should call the onDispose handler', () => {
        const handler = jest.fn()
        webview.onDispose(handler)
        expect(handler).not.toHaveBeenCalled()
        webview.dispose()
        expect(handler).toHaveBeenCalled()
      })
    })
    describe('and sending a message', () => {
      it('should send the message to the panel', () => {
        webview.postMessage(RequestType.REQUEST, { message: 'hello' })
        expect(panelMock.webview.postMessage).toHaveBeenCalledWith({
          type: RequestType.REQUEST,
          payload: { message: 'hello' },
        })
      })
    })
    describe('and receiving a message', () => {
      it('should handle the message if it have a type and payload', () => {
        const handler = jest.fn()
        webview.onMessage(handler)
        const message = {
          type: ResponseType.RESPONSE,
          payload: { message: 'hello' },
        }
        sendMessage(message)
        expect(handler).toHaveBeenCalledWith(message)
      })
      it('should ignore the message if does not have a type and payload', () => {
        const handler = jest.fn()
        webview.onMessage(handler)
        const message = {
          data: 'blabla',
        }
        sendMessage(message)
        expect(handler).not.toHaveBeenCalled()
      })
    })
  })
  describe('When getting a nonce', () => {
    it('should return a 32 chars long string made of letters and numbers', () => {
      expect(getNonce()).toMatch(/[A-z0-9]{32}/)
    })
  })
})
