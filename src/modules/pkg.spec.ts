import { getPackageJson, getPackageVersion } from './pkg'

/********************************************************
                          Mocks
*********************************************************/

import { getExtensionPath } from './path'
jest.mock('./path')
const getExtensionPathMock = getExtensionPath as jest.MockedFunction<
  typeof getExtensionPath
>

import { getCwd } from './workspace'
jest.mock('./workspace')
const getCwdMock = getCwd as jest.MockedFunction<typeof getCwd>

import fs from 'fs'
jest.mock('fs')
const fsReadFileSyncMock = fs.readFileSync as jest.MockedFunction<
  typeof fs.readFileSync
>

/********************************************************
                          Tests
*********************************************************/

describe('pkg', () => {
  beforeEach(() => {
    fsReadFileSyncMock.mockReturnValue('{ "version": "0.0.0-test" }')
    getExtensionPathMock.mockReturnValue('/path/to/extension')
    getCwdMock.mockReturnValue('/path/to/workspace')
  })
  afterEach(() => {
    fsReadFileSyncMock.mockReset()
    getExtensionPathMock.mockReset()
    getCwdMock.mockReset()
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
      expect(getPackageJson()).toEqual({ version: '0.0.0-test' })
    })
  })
  describe('When getting the package.json of the workspace', () => {
    it('should read the package.json from the workspace', () => {
      getPackageJson(null, true)
      expect(fsReadFileSyncMock).toHaveBeenCalledWith(
        '/path/to/workspace/package.json',
        'utf8'
      )
    })
  })
  describe('When getting the version of the package.json of the extension', () => {
    it('should return the version of the package.json', () => {
      expect(getPackageVersion()).toEqual('0.0.0-test')
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
  describe('When getting the package.json of a module in the workspace', () => {
    it('should read the package.json from that module in the workspace', () => {
      getPackageJson('some-module', true)
      expect(fsReadFileSyncMock).toHaveBeenCalledWith(
        '/path/to/workspace/node_modules/some-module/package.json',
        'utf8'
      )
    })
  })
  describe('When getting the version of the package.json of a module', () => {
    it('should read the package.json from that module', () => {
      getPackageVersion('some-module')
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
      it('should return null', () => {
        expect(getPackageVersion('some-non-existent-module')).toBeNull()
      })
    })
  })
})
