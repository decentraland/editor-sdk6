import { waitForServer } from './server'

/********************************************************
                          Mocks
 *********************************************************/

import fetch from 'node-fetch'
jest.mock('node-fetch')
const fetchMock = fetch as jest.MockedFunction<typeof fetch>

import { sleep } from './sleep'
jest.mock('./sleep')
const sleepMock = sleep as jest.MockedFunction<typeof sleep>

/********************************************************
                          Tests
*********************************************************/

describe('server', () => {
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
