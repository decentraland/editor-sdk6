import {
  clearPort,
  getPort,
  getServerParams,
  getServerUrl,
  ServerName,
  waitForServer,
} from './port'

/********************************************************
                          Mocks
*********************************************************/

import fetch from 'node-fetch'
jest.mock('node-fetch')
const fetchMock = fetch as jest.MockedFunction<typeof fetch>

import { sleep } from './sleep'
jest.mock('./sleep')
const sleepMock = sleep as jest.MockedFunction<typeof sleep>

import { getScene } from './path'
jest.mock('./path')
const getSceneMock = getScene as jest.MockedFunction<typeof getScene>

import net from 'net'
import { Scene } from '@dcl/schemas'
jest.spyOn(net, 'createServer')
const createServerSpy = net.createServer as jest.MockedFunction<
  typeof net.createServer
>

/********************************************************
                          Tests
*********************************************************/

describe('port', () => {
  beforeEach(() => {
    clearPort(ServerName.DCLPreview)
  })
  afterEach(() => {
    createServerSpy.mockClear()
    fetchMock.mockClear()
    sleepMock.mockClear()
  })
  describe('When getting a port for a given server', () => {
    it('should resolve to an available port', async () => {
      await expect(getPort(ServerName.DCLPreview)).resolves.toEqual(
        expect.any(Number)
      )
    })
    it('should create a server', async () => {
      await getPort(ServerName.DCLPreview)
      expect(createServerSpy).toHaveBeenCalled()
    })
    describe('and the port has already been assigned', () => {
      it('should reuse the port already assigned to that server', async () => {
        await getPort(ServerName.DCLPreview)
        expect(createServerSpy).toHaveBeenCalledTimes(1)
        createServerSpy.mockClear()
        await getPort(ServerName.DCLPreview)
        expect(createServerSpy).toHaveBeenCalledTimes(0)
      })
    })
  })
  describe('When getting the url for a server', () => {
    it('should point to localhost and the port for the given server name', async () => {
      await expect(getServerUrl(ServerName.DCLPreview)).resolves.toMatch(
        /http:\/\/localhost:\d+/
      )
    })
  })
  describe('When params for a server', () => {
    describe('and the server is DCLPreview', () => {
      beforeEach(() => {
        getSceneMock.mockReturnValue({
          scene: { base: '0,0' },
        } as unknown as Scene)
      })
      afterEach(() => {
        getSceneMock.mockReset()
      })
      it('should return the position', () => {
        expect(getServerParams(ServerName.DCLPreview)).toBe('?position=0,0')
      })
    })
    describe('and the server is not DCLPreview', () => {
      it('should return nothing', () => {
        expect(getServerParams(ServerName.DCLDeploy)).toBe('')
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
