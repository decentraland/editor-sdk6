import {
  getGlobalValue,
  getLocalValue,
  setGlobalValue,
  setLocalValue,
} from './storage'

/********************************************************
                          Mocks
*********************************************************/

import { ExtensionContext } from 'vscode'
import { getContext } from './context'
jest.mock('./context')
const getContextMock = getContext as jest.MockedFunction<typeof getContext>

let contextMock: ReturnType<typeof mockContext>
function mockContext() {
  return {
    workspaceState: {
      get: jest.fn(),
      update: jest.fn(),
    },
    globalState: {
      get: jest.fn(),
      update: jest.fn(),
    },
  }
}

/********************************************************
                          Tests
*********************************************************/

describe('storage', () => {
  beforeEach(() => {
    contextMock = mockContext()
    getContextMock.mockReturnValue(contextMock as unknown as ExtensionContext)
  })
  afterEach(() => {
    getContextMock.mockReset()
  })
  describe('When getting a local value', () => {
    it('should return the value from the workspace state', () => {
      getLocalValue('someValue')
      expect(contextMock.workspaceState.get).toHaveBeenCalledWith('someValue')
    })
  })
  describe('When setting a local value', () => {
    it('should update the value on the workspace state', () => {
      setLocalValue('someKey', 'someValue')
      expect(contextMock.workspaceState.update).toHaveBeenCalledWith(
        'someKey',
        'someValue'
      )
    })
  })
  describe('When getting a global value', () => {
    it('should return the value from the global state', () => {
      getGlobalValue('someValue')
      expect(contextMock.globalState.get).toHaveBeenCalledWith('someValue')
    })
  })
  describe('When setting a global value', () => {
    it('should update the value on the global state', () => {
      setGlobalValue('someKey', 'someValue')
      expect(contextMock.globalState.update).toHaveBeenCalledWith(
        'someKey',
        'someValue'
      )
    })
  })
})
