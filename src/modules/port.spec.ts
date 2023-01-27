import { clearPort, getPort } from './port'

/********************************************************
                          Mocks
 *********************************************************/

import net from 'net'
jest.spyOn(net, 'createServer')
const createServerSpy = net.createServer as jest.MockedFunction<
  typeof net.createServer
>

/********************************************************
                          Tests
*********************************************************/

describe('port', () => {
  beforeEach(() => {
    clearPort('my-server')
  })
  afterEach(() => {
    createServerSpy.mockClear()
  })
  describe('When getting a port for a given server', () => {
    it('should resolve to an available port', async () => {
      await expect(getPort('my-server')).resolves.toEqual(expect.any(Number))
    })
    it('should create a server', async () => {
      await getPort('my-server')
      expect(createServerSpy).toHaveBeenCalled()
    })
    describe('and the port has already been assigned', () => {
      it('should reuse the port already assigned to that server', async () => {
        await getPort('my-server')
        expect(createServerSpy).toHaveBeenCalledTimes(1)
        createServerSpy.mockClear()
        await getPort('my-server')
        expect(createServerSpy).toHaveBeenCalledTimes(0)
      })
    })
  })
})
