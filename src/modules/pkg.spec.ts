/********************************************************
                          Mocks
*********************************************************/

import { getExtensionPath } from './path'
jest.mock('./path')
const getExtensionPathMock = getExtensionPath as jest.MockedFunction<
  typeof getExtensionPath
>

import fs from 'fs'
import { getPackageJson } from './pkg'
jest.mock('fs')
const fsReadFileSyncMock = fs.readFileSync as jest.MockedFunction<
  typeof fs.readFileSync
>

/********************************************************
                          Tests
*********************************************************/

describe('pkg', () => {
  beforeEach(() => {
    fsReadFileSyncMock.mockReturnValue('{ "name": "A module" }')
    getExtensionPathMock.mockReturnValue('/path/to/extension')
  })
  afterEach(() => {
    fsReadFileSyncMock.mockReset()
    getExtensionPathMock.mockReset()
  })
  describe('When getting the package.json of the extension', () => {
    it('should read the package.json of the extension', () => {
      getPackageJson()
      expect(fsReadFileSyncMock).toHaveBeenCalledWith(
        '/path/to/extension/package.json',
        'utf8'
      )
    })
    it('should return the parsed package.json', () => {
      expect(getPackageJson()).toEqual({ name: 'A module' })
    })
  })
  describe('When getting the package.json of a module', () => {
    it('should read the package.json from that module', () => {
      getPackageJson('some-module')
      expect(fsReadFileSyncMock).toHaveBeenCalledWith(
        '/path/to/extension/node_modules/some-module/package.json',
        'utf8'
      )
    })
    describe('and the module does not exist', () => {
      beforeEach(() => {
        fsReadFileSyncMock.mockImplementation(() => {
          throw new Error('Not found')
        })
      })
      afterEach(() => {
        fsReadFileSyncMock.mockReset()
      })
      it('should throw', () => {
        expect(() => getPackageJson('some-non-existent-module')).toThrow(
          `Could not get package.json for module "some-non-existent-module": Not found`
        )
      })
    })
  })
})
