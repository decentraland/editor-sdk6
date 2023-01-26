import { Scene } from '@dcl/schemas'
import {
  getServerParams,
  getServerUrl,
  ServerName,
  waitForServer,
} from './server'

/********************************************************
                          Mocks
 *********************************************************/

import fetch from 'node-fetch'
jest.mock('node-fetch')
const fetchMock = fetch as jest.MockedFunction<typeof fetch>

import { sleep } from './sleep'
jest.mock('./sleep')
const sleepMock = sleep as jest.MockedFunction<typeof sleep>

import { getScene } from './workspace'
jest.mock('./workspace')
const getSceneMock = getScene as jest.MockedFunction<typeof getScene>

import { getLocalValue } from './storage'
jest.mock('./storage')
const getLocalValueMock = getLocalValue as jest.MockedFunction<
  typeof getLocalValue
>

/********************************************************
                          Tests
*********************************************************/

describe('server', () => {
  beforeEach(() => {
    getSceneMock.mockReturnValue({
      scene: { base: '0,0' },
    } as unknown as Scene)
  })
  afterEach(() => {
    getSceneMock.mockReset()
  })
  describe('When params for a server', () => {
    describe('and the server is RunScene', () => {
      it('should return the position', () => {
        expect(getServerParams(ServerName.RunScene)).toBe('?position=0,0')
      })
    })
    describe('and the server is PublishScene', () => {
      describe('and the scene is being published to Genesis City', () => {
        beforeEach(() => {
          getLocalValueMock.mockReturnValueOnce(false)
        })
        afterEach(() => {
          getLocalValueMock.mockReset()
        })
        it('should return nothing', () => {
          expect(getServerParams(ServerName.PublishScene)).toBe('')
        })
      })
      describe('and the scene is being published to Genesis City', () => {
        beforeEach(() => {
          getLocalValueMock.mockReturnValueOnce(true)
        })
        afterEach(() => {
          getLocalValueMock.mockReset()
        })
        it('should add the skipValidations query param', () => {
          expect(getServerParams(ServerName.PublishScene)).toBe(
            '?skipValidations=true'
          )
        })
      })
    })
    describe('and the server does not match any case', () => {
      it('should return nothing', () => {
        expect(getServerParams(ServerName.GLTFPreview)).toBe('')
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
  describe('When getting the url for a server', () => {
    it('should point to localhost and the port for the given server name', async () => {
      await expect(getServerUrl(ServerName.RunScene)).resolves.toMatch(
        /http:\/\/localhost:\d+/
      )
    })
  })
})
