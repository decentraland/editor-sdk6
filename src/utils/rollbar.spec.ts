import {
  activateRollbar,
  deactivateRollbar,
  getRollbar,
  report,
} from './rollbar'

import Rollbar from 'rollbar'
import { ExtensionMode } from 'vscode'
jest.mock('rollbar')
const RollbarMock = Rollbar as jest.MockedFunction<any>

describe('rollbar', () => {
  const realProcessEnv = process.env
  beforeEach(() => {
    Object.defineProperty(process, 'env', {
      value: {
        DCL_EDITOR_ROLLBAR_KEY: 'rollbar-key',
      },
    })
  })
  afterEach(() => {
    Object.defineProperty(process, 'env', {
      value: realProcessEnv,
    })
    RollbarMock.mockClear()
    deactivateRollbar()
  })
  describe('When activating Rollbar', () => {
    it('should not throw when getting Rollbar', () => {
      activateRollbar(ExtensionMode.Test)
      expect(() => getRollbar()).not.toThrow()
    })
    it('should use the Rollbar access token from the environment', () => {
      activateRollbar(ExtensionMode.Test)
      expect(RollbarMock).toHaveBeenCalledWith(
        expect.objectContaining({ accessToken: 'rollbar-key' })
      )
    })
    describe('and the extension mode is development mode', () => {
      it('should use use Rollbar in the development environment', () => {
        activateRollbar(ExtensionMode.Development)
        expect(RollbarMock).toHaveBeenCalledWith(
          expect.objectContaining({ environment: 'development' })
        )
      })
    })
    describe('and the extension mode is production mode', () => {
      it('should use use Rollbar in the production environment', () => {
        activateRollbar(ExtensionMode.Production)
        expect(RollbarMock).toHaveBeenCalledWith(
          expect.objectContaining({ environment: 'production' })
        )
      })
    })
    describe('and there is no Rollbar key in the environment', () => {
      beforeEach(() => {
        Object.defineProperty(process, 'env', {
          value: {},
        })
      })
      afterEach(() => {
        Object.defineProperty(process, 'env', {
          value: realProcessEnv,
        })
      })
      it('should not activate Rollbar', () => {
        activateRollbar(ExtensionMode.Test)
        expect(RollbarMock).not.toHaveBeenCalled()
      })
    })
    describe('and Rollbar was already activated, it should not activate it again', () => {
      it('should not activate Rollbar', () => {
        activateRollbar(ExtensionMode.Test)
        activateRollbar(ExtensionMode.Test)
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
