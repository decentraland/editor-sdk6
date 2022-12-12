import {
  activateAnalytics,
  deactivateAnalytics,
  getAnalytics,
  track,
} from './analytics'

/********************************************************
                          Mocks
*********************************************************/

import { log } from './log'
jest.mock('./log')
const logMock = log as jest.MockedFunction<typeof log>

import { getGlobalValue, setGlobalValue } from './storage'
jest.mock('./storage')
const getGlobalValueMock = getGlobalValue as jest.MockedFunction<
  typeof getGlobalValue
>
const setGlobalValueMock = setGlobalValue as jest.MockedFunction<
  typeof setGlobalValue
>

import { getPackageJson } from './pkg'
jest.mock('./pkg')
const getPackageJsonMock = getPackageJson as jest.MockedFunction<
  typeof getPackageJson
>

import Analytics from 'analytics-node'
jest.mock('analytics-node')
const AnalyticsMock = Analytics as jest.MockedFunction<any>

import { uuid } from 'uuidv4'
jest.mock('uuidv4')
const uuidMock = uuid as jest.MockedFunction<typeof uuid>

/********************************************************
                          Tests
*********************************************************/

describe('analytics', () => {
  describe('When calling activateAnalytics', () => {
    afterEach(() => {
      deactivateAnalytics()
      logMock.mockReset()
    })
    describe('and the DCL_EDITOR_SEGMENT_KEY env var is not present', () => {
      it('should not activate', () => {
        activateAnalytics()
        expect(logMock).toHaveBeenCalledWith('Analytics disabled')
      })
    })
    describe('and the DCL_EDITOR_SEGMENT_KEY env var is present', () => {
      const { env } = process
      beforeEach(() => {
        process.env = {
          DCL_EDITOR_SEGMENT_KEY: 'api-key',
          platform: 'test-platform',
          arch: 'test-arch',
        }
        getPackageJsonMock.mockReturnValue({
          version: '0.0.0-test',
          engines: { node: '0.0.0' },
        })
      })
      afterEach(() => {
        process.env = env
        getPackageJsonMock.mockReset()
      })
      describe('and the user ID is not stored in global state', () => {
        beforeEach(() => {
          getGlobalValueMock.mockReturnValueOnce(null)
          uuidMock.mockReturnValue('user-id')
          AnalyticsMock.mockImplementationOnce(() => ({
            identify: jest.fn(),
            track: jest.fn(),
          }))
        })
        afterEach(() => {
          getGlobalValueMock.mockReset()
          setGlobalValueMock.mockReset()
          uuidMock.mockReset()
          AnalyticsMock.mockReset()
        })
        it('should activate analytics', () => {
          activateAnalytics()
          expect(AnalyticsMock).toHaveBeenCalledWith('api-key')
          expect(getAnalytics()).not.toBeNull()
        })
        it('should create a user ID and store in global state', () => {
          activateAnalytics()
          expect(getGlobalValueMock).toHaveBeenCalledWith('analytics-user-id')
          expect(setGlobalValueMock).toHaveBeenCalledWith(
            'analytics-user-id',
            'user-id'
          )
        })
        it('should identify the user', () => {
          activateAnalytics()
          expect(getAnalytics().identify).toHaveBeenCalledWith({
            userId: 'user-id',
            traits: {
              platform: process.platform,
              arch: process.arch,
              version: '0.0.0-test',
            },
          })
        })
      })
      describe('and the user ID is already stored in global state', () => {
        beforeEach(() => {
          getGlobalValueMock.mockReturnValueOnce('user-id')
        })
        afterEach(() => {
          getGlobalValueMock.mockReset()
          setGlobalValueMock.mockReset()
          uuidMock.mockReset()
          AnalyticsMock.mockReset()
        })
        it('should re-use the ID from global state', () => {
          activateAnalytics()
          expect(uuidMock).not.toHaveBeenCalled()
          expect(setGlobalValueMock).not.toHaveBeenCalled()
        })
      })
      describe('and calling deactivateAnalytics afterwards', () => {
        it('should make getAnalytics() throw', () => {
          activateAnalytics()
          expect(getAnalytics()).not.toBeNull()
          deactivateAnalytics()
          expect(() => getAnalytics()).toThrow(
            'Analytics were not initialized yet'
          )
        })
      })
      describe('and calling track() afterwards', () => {
        it('should track an event', () => {
          activateAnalytics()
          getGlobalValueMock.mockReturnValueOnce('user-id')
          track('event-name', { some: 'value' })
          expect(getAnalytics().track).toHaveBeenCalledWith(
            expect.objectContaining({
              event: 'event-name',
              properties: { some: 'value' },
              userId: 'user-id',
            }),
            expect.any(Function)
          )
        })
        describe('and it has an error', () => {
          const realConsoleWarn = console.warn
          beforeEach(() => {
            console.warn = jest.fn()
            AnalyticsMock.mockImplementationOnce(() => ({
              identify: jest.fn(),
              track: jest.fn().mockImplementationOnce((_payload, onError) => {
                onError(new Error('Oopsie daisy'))
              }),
            }))
          })
          afterEach(() => {
            console.warn = realConsoleWarn
            AnalyticsMock.mockReset()
          })
          it('should warn the error', () => {
            activateAnalytics()
            getGlobalValueMock.mockReturnValueOnce('user-id')
            track('event-name', { some: 'value' })
            expect(console.warn).toHaveBeenCalledWith(
              'Could not track event "event-name": Oopsie daisy'
            )
          })
        })
      })
      describe('and calling activateAnalytics again afterwads', () => {
        it('should work even if already activated', () => {
          activateAnalytics()
          activateAnalytics()
        })
      })
    })
  })
  describe('When calling deactivateAnalytics', () => {
    it('should always work even if not activated yet', () => {
      deactivateAnalytics()
      deactivateAnalytics()
    })
  })
  describe('When calling getAnalytics() before activating analytics', () => {
    it('should throw', () => {
      expect(() => getAnalytics()).toThrow()
    })
  })
  describe('When calling track() before activating analytics', () => {
    it('should not throw', () => {
      expect(() => track('event-name')).not.toThrow()
    })
  })
})
