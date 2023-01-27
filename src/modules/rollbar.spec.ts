import {
  activateRollbar,
  deactivateRollbar,
  getRollbar,
  report,
} from './rollbar'

/********************************************************
                          Mocks
*********************************************************/

import Rollbar from 'rollbar'
import { ExtensionMode } from 'vscode'
jest.mock('rollbar')
const RollbarMock = Rollbar as jest.MockedFunction<any>

/********************************************************
                          Tests
*********************************************************/

describe('rollbar', () => {
  afterEach(() => {
    RollbarMock.mockClear()
    deactivateRollbar()
  })
  describe('When activating Rollbar', () => {
    it('should not throw when getting Rollbar', () => {
      activateRollbar(ExtensionMode.Test, 'api-key')
      expect(() => getRollbar()).not.toThrow()
    })
    it('should use the Rollbar access token from the environment', () => {
      activateRollbar(ExtensionMode.Test, 'api-key')
      expect(RollbarMock).toHaveBeenCalledWith(
        expect.objectContaining({ accessToken: 'api-key' })
      )
    })
    describe('and the extension mode is development mode', () => {
      it('should use use Rollbar in the development environment', () => {
        activateRollbar(ExtensionMode.Development, 'api-key')
        expect(RollbarMock).toHaveBeenCalledWith(
          expect.objectContaining({ environment: 'development' })
        )
      })
    })
    describe('and the extension mode is production mode', () => {
      it('should use use Rollbar in the production environment', () => {
        activateRollbar(ExtensionMode.Production, 'api-key')
        expect(RollbarMock).toHaveBeenCalledWith(
          expect.objectContaining({ environment: 'production' })
        )
      })
    })
    describe('and no API key is used', () => {
      it('should not activate Rollbar', () => {
        activateRollbar(ExtensionMode.Test)
        expect(RollbarMock).not.toHaveBeenCalled()
      })
    })
    describe('and Rollbar was already activated, it should not activate it again', () => {
      const realConsoleWarn = console.warn
      beforeAll(() => {
        console.warn = jest.fn()
      })
      afterAll(() => {
        console.warn = realConsoleWarn
      })
      it('should not activate Rollbar', () => {
        activateRollbar(ExtensionMode.Test, 'api-key')
        activateRollbar(ExtensionMode.Test, 'api-key')
        expect(RollbarMock).toHaveBeenCalledTimes(1)
      })
    })
  })
  describe('When getting Rollbar before it was activated', () => {
    it('should throw', () => {
      expect(() => getRollbar()).toThrow()
    })
  })
  describe('When reporting before Rollbar was activated', () => {
    it('should not throw', () => {
      expect(() => report(new Error('Some error'))).not.toThrow()
    })
  })
})
