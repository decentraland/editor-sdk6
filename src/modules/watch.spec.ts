import { watch, unwatch } from './watch'

/********************************************************
                          Mocks
*********************************************************/

import { refreshTree } from '../dependencies/tree'
jest.mock('../dependencies/tree')
const refreshTreeMock = refreshTree as jest.MockedFunction<typeof refreshTree>

import { debounce } from './debounce'
jest.mock('./debounce')
const debounceMock = debounce as jest.MockedFunction<typeof debounce>

import { getCwd } from './workspace'
jest.mock('./workspace')
const getCwdMock = getCwd as jest.MockedFunction<typeof getCwd>

import chokidar from 'chokidar'
jest.spyOn(chokidar, 'watch')
const watchSpy = chokidar.watch as jest.MockedFunction<typeof chokidar.watch>

let watcherMock: ReturnType<typeof mockWatcher>
let triggerChange: () => void
function mockWatcher() {
  return {
    on: jest.fn().mockImplementation((_eventName, cb) => {
      triggerChange = cb
    }),
    unwatch: jest.fn(),
  }
}

/********************************************************
                          Tests
*********************************************************/

describe('watch', () => {
  beforeEach(() => {
    watcherMock = mockWatcher()
    getCwdMock.mockReturnValue('/path/to/workspace')
    watchSpy.mockReturnValue(watcherMock as unknown as chokidar.FSWatcher)
    debounceMock.mockImplementation((cb) => cb)
  })
  afterEach(() => {
    getCwdMock.mockClear()
    refreshTreeMock.mockClear()
    debounceMock.mockClear()
    unwatch()
  })
  describe('When watching', () => {
    it('should watch the node_modules directory of the workspace', () => {
      watch()
      expect(watchSpy).toHaveBeenCalledWith('/path/to/workspace/node_modules')
    })
    it('refresh the tree when a change is detected ', () => {
      watch()
      triggerChange()
      expect(refreshTreeMock).toHaveBeenCalled()
    })
  })
  describe('When unwatching', () => {
    it('should unwatch the watcher', () => {
      watch()
      unwatch()
      expect(watcherMock.unwatch).toHaveBeenCalledWith(
        '/path/to/workspace/node_modules'
      )
    })
  })
})
