import { ExtensionContext } from 'vscode'
import { getContext, setContext } from './context'

/********************************************************
                          Mocks
*********************************************************/

const contextMock = {} as ExtensionContext

import { log } from './log'
jest.mock('./log')
const logMock = log as jest.MockedFunction<typeof log>

/********************************************************
                          Tests
*********************************************************/

describe('context', () => {
  afterEach(() => {
    logMock.mockReset()
    setContext(null)
  })
  describe('When setting the context', () => {
    it('should not throw', () => {
      expect(() => setContext(contextMock)).not.toThrow()
    })
    it('should log that the context has been set', () => {
      setContext(contextMock)
      expect(logMock).toHaveBeenCalledWith('Extension context has been set')
    })
  })
  describe('When unsetting the context', () => {
    beforeEach(() => {
      setContext(contextMock)
    })
    afterEach(() => {
      setContext(null)
    })
    it('should log that the context has been unset', () => {
      setContext(null)
      expect(logMock).toHaveBeenCalledWith('Extension context has been unset')
    })
  })
  describe('When getting the context', () => {
    describe('and the context has been already set', () => {
      beforeEach(() => {
        setContext(contextMock)
      })
      afterEach(() => {
        setContext(null)
      })
      it('should return the context', () => {
        expect(getContext()).toBe(contextMock)
      })
    })
    describe('and the context hass not been set yet', () => {
      it('should throw', () => {
        expect(() => getContext()).toThrow(`Context has not been set yet`)
      })
    })
  })
})
