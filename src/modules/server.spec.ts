import { Server, StaticServer, waitForServer } from './server'

/********************************************************
                          Mocks
 *********************************************************/

import fetch from 'node-fetch'
jest.mock('node-fetch')
const fetchMock = fetch as jest.MockedFunction<typeof fetch>

import { sleep } from './sleep'
jest.mock('./sleep')
const sleepMock = sleep as jest.MockedFunction<typeof sleep>

class DummyServer extends Server {
  onStart = jest.fn()
  onStop = jest.fn()
}

import express from 'express'
const expressMock = express as jest.MockedFunction<typeof express>
const expressStaticMock = expressMock.static as jest.MockedFunction<
  typeof express.static
>

/********************************************************
                          Tests
*********************************************************/

describe('server', () => {
  describe('When implementing a server', () => {
    let server: DummyServer
    beforeEach(() => {
      server = new DummyServer('dummy-server')
    })
    describe('and the onStart method resolves successfully', () => {
      beforeEach(() => {
        server.onStart.mockResolvedValueOnce(void 0)
        server.onStop.mockResolvedValueOnce(void 0)
      })
      afterEach(() => {
        server.onStart.mockReset()
        server.onStop.mockReset()
      })
      describe('and the server is started', () => {
        it('should call onStart', async () => {
          await server.start()
          expect(server.onStart).toHaveBeenCalledTimes(1)
        })
        it('should pass the arguments to the onStart method', async () => {
          await server.start(1, 2, 3)
          expect(server.onStart).toHaveBeenCalledWith(1, 2, 3)
        })
        it('should not call onStop', async () => {
          await server.start()
          expect(server.onStop).not.toHaveBeenCalled()
        })
        it('should turn the isStarting flag off once started', async () => {
          await server.start()
          expect(server.isStarting).toBe(false)
        })
        it('should turn the isRunning flag on once started', async () => {
          expect(server.isRunning).toBe(false)
          await server.start()
          expect(server.isRunning).toBe(true)
        })
      })
      describe('and the server is started several times before it finishes starting', () => {
        beforeEach(() => {
          server.onStart.mockImplementation(
            () => new Promise((resolve) => setTimeout(resolve, 100))
          )
        })
        afterEach(() => {
          server.onStart.mockReset()
        })
        it('should call onStart only once', async () => {
          server.start()
          await server.start()
          expect(server.onStart).toHaveBeenCalledTimes(1)
        })
        it('should turn the isStarting flag on while starting', async () => {
          server.start()
          await sleep(50)
          expect(server.isStarting).toBe(true)
        })
      })
      describe('and the server is started again after it has been already started', () => {
        it('should call onStop once', async () => {
          await server.start()
          await server.start()
          expect(server.onStop).toHaveBeenCalledTimes(1)
        })
      })
      describe('and the server is restarted', () => {
        it('should call onStop once', async () => {
          await server.start()
          await server.restart()
          expect(server.onStop).toHaveBeenCalledTimes(1)
        })
        it('should call onStart twice', async () => {
          await server.start()
          await server.restart()
          expect(server.onStart).toHaveBeenCalledTimes(2)
        })
      })
    })
    describe('and the onStart method throws', () => {
      beforeEach(() => {
        server.onStart.mockRejectedValueOnce(new Error('Some error'))
      })
      afterEach(() => {
        server.onStart.mockReset()
      })
      describe('and the server is started', () => {
        it('should not throw', async () => {
          await expect(() => server.start()).not.toThrow()
        })
        it('should not set the isRunning flag on', async () => {
          await server.start()
          await expect(server.isRunning).toBe(false)
        })
        it('should set the isStarting flag off', async () => {
          await server.start()
          await expect(server.isStarting).toBe(false)
        })
      })
    })
    describe('and the onStop method resolves successfully', () => {
      beforeEach(() => {
        server.onStop.mockResolvedValueOnce(void 0)
        server.onStart.mockResolvedValueOnce(void 0)
      })
      afterEach(() => {
        server.onStop.mockReset()
        server.onStart.mockReset()
      })
      describe('and the server is stopped', () => {
        it('should call onStop', async () => {
          await server.start()
          await server.stop()
          expect(server.onStop).toHaveBeenCalledTimes(1)
        })
        it('should not call onStart', async () => {
          await server.stop()
          expect(server.onStart).not.toHaveBeenCalled()
        })
        it('should turn the isStopping flag off once stopped', async () => {
          await server.stop()
          expect(server.isStopping).toBe(false)
        })
        it('should turn the isRunning flag off once stopped', async () => {
          await server.start()
          expect(server.isRunning).toBe(true)
          await server.stop()
          expect(server.isRunning).toBe(false)
        })
      })
      describe('and the server is stopped several times before it finishes stopping', () => {
        beforeEach(() => {
          server.onStop.mockImplementation(
            () => new Promise((resolve) => setTimeout(resolve, 100))
          )
        })
        afterEach(() => {
          server.onStop.mockReset()
        })
        it('should call onStop only once', async () => {
          await server.start()
          server.stop()
          await server.stop()
          expect(server.onStop).toHaveBeenCalledTimes(1)
        })
      })
      describe('and the server is stopped again after it has been already stopped', () => {
        it('should call onStop once', async () => {
          await server.start()
          await server.stop()
          await server.stop()
          expect(server.onStop).toHaveBeenCalledTimes(1)
        })
      })
    })
    describe('and the onStop method throws', () => {
      beforeEach(() => {
        server.onStop.mockRejectedValueOnce(new Error('Some error'))
      })
      afterEach(() => {
        server.onStop.mockReset()
      })
      describe('and the server is stopped', () => {
        it('should not throw', async () => {
          await expect(() => server.stop()).not.toThrow()
        })
        it('should not set the isRunning flag off', async () => {
          await server.start()
          await expect(server.isRunning).toBe(true)
          await server.stop()
          await expect(server.isRunning).toBe(true)
        })
        it('should set the isStopping flag off', async () => {
          await server.start()
          await expect(server.isStopping).toBe(false)
        })
      })
    })
  })
  describe('When using a StaticServer', () => {
    let staticServer: StaticServer
    beforeEach(() => {
      staticServer = new StaticServer('static-server', 'path/to/webview')
    })
    afterEach(() => {
      expressMock.mockClear()
      expressStaticMock.mockClear()
    })
    it('should create an express server', async () => {
      expect(expressMock).toHaveBeenCalled()
    })
    describe('and the server is started', () => {
      it('should use the static router to server the content from the path provided', async () => {
        await staticServer.start()
        expect(expressStaticMock).toHaveBeenCalledWith('path/to/webview')
      })
      it('should wire the router only once even if the server is started multiple times', async () => {
        await staticServer.start()
        await staticServer.start()
        expect(expressStaticMock).toHaveBeenCalledTimes(1)
      })
    })
    describe('and the path is provided as a function', () => {
      beforeEach(() => {
        staticServer = new StaticServer(
          'static-server',
          () => 'path/to/webview'
        )
      })
      it('should resolve the path', async () => {
        await staticServer.start()
        expect(expressStaticMock).toHaveBeenCalledWith('path/to/webview')
      })
    })
    describe('and the server is stopped', () => {
      it('should close the server and set it to null', async () => {
        await staticServer.start()
        const serverMock = staticServer.server as unknown as {
          close: jest.MockedFunction<typeof sleep>
        }
        await staticServer.stop()
        expect(serverMock.close).toHaveBeenCalled()
        expect(staticServer.server).toBe(null)
      })
    })
  })
  describe('When waiting for a server', () => {
    describe('and the server is up', () => {
      it('should resolve', async () => {
        await expect(waitForServer('http://localhost:1234')).resolves.toBe(
          void 0
        )
      })
      it('should fetch the server url', async () => {
        await waitForServer('http://localhost:1234')
        expect(fetchMock).toHaveBeenCalledWith('http://localhost:1234')
      })
    })
    describe('and the server is down', () => {
      it('should wait for the server to be up', async () => {
        fetchMock.mockImplementationOnce(() => {
          throw new Error('Server is down')
        })
        await waitForServer('http://localhost:1234')
        expect(sleepMock).toHaveBeenCalled()
      })
    })
  })
})
