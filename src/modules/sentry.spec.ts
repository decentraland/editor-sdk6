import {
  activateSentry,
  deactivateSentry,
  report,
} from './sentry'

/********************************************************
                          Mocks
*********************************************************/

import * as Sentry from '@sentry/node'
import { ExtensionMode } from 'vscode'

jest.mock('@sentry/node')

let SentryMock: jest.MockedFunction<any>

/********************************************************
                          Tests
*********************************************************/

describe('sentry', () => {
  beforeEach(() => {
    SentryMock =  Sentry as jest.MockedFunction<any>
  })

  afterEach(() => {
    SentryMock.init.mockClear()
    SentryMock.captureException.mockClear()
    deactivateSentry()
  })

  describe('When activating Sentry', () => {
    it('should use the Sentry DSN from the environment', () => {
      activateSentry(ExtensionMode.Test, 'https://public@sentry.example.com/1')
      expect(SentryMock.init).toHaveBeenCalledWith(
        expect.objectContaining({ dsn: 'https://public@sentry.example.com/1' })
      )
    })

    describe('and the extension mode is development mode', () => {
      it('should use use Sentry in the development environment', () => {
        activateSentry(ExtensionMode.Development, 'https://public@sentry.example.com/1')
        expect(SentryMock.init).toHaveBeenCalledWith(
          expect.objectContaining({ environment: 'development' })
        )
      })
    })

    describe('and the extension mode is production mode', () => {
      it('should use use Sentry in the production environment', () => {
        activateSentry(ExtensionMode.Production, 'https://public@sentry.example.com/1')
        expect(SentryMock.init).toHaveBeenCalledWith(
          expect.objectContaining({ environment: 'production' })
        )
      })
    })

    describe('and no DSN is used', () => {
      it('should not activate Sentry', () => {
        activateSentry(ExtensionMode.Test)
        expect(SentryMock.init).not.toHaveBeenCalled()
      })
    })

    describe('and Sentry was already activated, it should not activate it again', () => {
      const realConsoleWarn = console.warn
      beforeAll(() => {
        console.warn = jest.fn()
      })

      afterAll(() => {
        console.warn = realConsoleWarn
      })

      it('should not activate Sentry', () => {
        activateSentry(ExtensionMode.Test, 'https://public@sentry.example.com/1')
        activateSentry(ExtensionMode.Test, 'https://public@sentry.example.com/1')
        expect(SentryMock.init).toHaveBeenCalledTimes(1)
      })
    })
    
    describe('and an error is being reported', () => {
      it('should call the captureException function with the error', () => {
        activateSentry(ExtensionMode.Test, 'https://public@sentry.example.com/1')
        report(new Error('Some error'))
        expect(SentryMock.captureException).toHaveBeenCalledWith(new Error('Some error'))
      })
    })
  })

  describe('When reporting before Sentry was activated', () => {
    it('should not throw', () => {
      expect(() => report(new Error('Some error'))).not.toThrow()
    })
  })
})
