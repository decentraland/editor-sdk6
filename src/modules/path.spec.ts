import {
  getExtensionPath,
  getFilePaths,
  getGlobalStoragePath,
  getModuleBinPath,
  getNodeBinPath,
  joinEnvPaths,
  setExtensionPath,
  setGlobalStoragePath,
} from './path'

/********************************************************
                          Mocks
*********************************************************/

import { log } from './log'
jest.mock('./log')
const logMock = log as jest.MockedFunction<typeof log>

import fs, { Dirent, Stats } from 'fs'
jest.mock('fs')
const fsReaddirSyncMock = fs.readdirSync as jest.MockedFunction<
  typeof fs.readdirSync
>
const fsLstatSyncMock = fs.lstatSync as jest.MockedFunction<typeof fs.lstatSync>

import { getPackageJson } from './pkg'
import { setVersion } from './node'
jest.mock('./pkg')
const getPackageJsonMock = getPackageJson as jest.MockedFunction<
  typeof getPackageJson
>

/********************************************************
                          Tests
*********************************************************/

describe('path', () => {
  afterEach(() => {
    logMock.mockRestore()
  })
  describe('When setting the extension path', () => {
    it('should log when the extension path is set', () => {
      setExtensionPath('/path/to/extension')
      expect(logMock).toHaveBeenCalledWith(
        `Extension path has been set to "/path/to/extension"`
      )
    })
    it('should be possible to retrieve the extension path after setting it', () => {
      setExtensionPath('/path/to/extension')
      expect(getExtensionPath()).toBe('/path/to/extension')
    })
  })
  describe('When unsetting the extension path', () => {
    it('should log when the extension path is unset', () => {
      setExtensionPath(null)
      expect(logMock).toHaveBeenCalledWith(`Extension path has been unset`)
    })
    it('should throw when trying to retrieve the extension path after unsetting it', () => {
      setExtensionPath(null)
      expect(() => getExtensionPath()).toThrow()
    })
  })
  describe('When setting the global storage path', () => {
    it('should log when the global storage path is set', () => {
      setGlobalStoragePath('/path/to/globalStorage')
      expect(logMock).toHaveBeenCalledWith(
        `Global storage path has been set to "/path/to/globalStorage"`
      )
    })
    it('should be possible to retrieve the global storage path after setting it', () => {
      setGlobalStoragePath('/path/to/globalStorage')
      expect(getGlobalStoragePath()).toBe('/path/to/globalStorage')
    })
  })
  describe('When unsetting the global storage path', () => {
    it('should log when the global storage path is unset', () => {
      setGlobalStoragePath(null)
      expect(logMock).toHaveBeenCalledWith(`Global storage path has been unset`)
    })
    it('should throw when trying to retrieve the global storage after unsetting it', () => {
      setGlobalStoragePath(null)
      expect(() => getGlobalStoragePath()).toThrow()
    })
  })
  describe('When getting the bin path for a node module', () => {
    beforeAll(() => {
      setExtensionPath('/path/to/extension')
    })
    afterAll(() => {
      setExtensionPath(null)
    })
    describe('and the module has binaries', () => {
      beforeEach(() => {
        getPackageJsonMock.mockReturnValue({
          version: '0.0.0-test',
          bin: { cmd: '/path/to/cmd.js' },
          engines: { node: '0.0.0-test' },
        })
      })
      describe('and the command is part of the binaries', () => {
        it('should return the path to the bin file', () => {
          expect(getModuleBinPath('some-module', 'cmd')).toBe(
            '/path/to/extension/node_modules/some-module/path/to/cmd.js'
          )
        })
      })
      describe('and the command is not part of the binaries', () => {
        it('should throw', () => {
          expect(() =>
            getModuleBinPath('some-module', 'non-existent-cmd')
          ).toThrow()
        })
      })
    })
    describe('and the module does not have binaries', () => {
      beforeEach(() => {
        getPackageJsonMock.mockReturnValue({
          version: '0.0.0-test',
          engines: { node: '0.0.0-test' },
        })
      })
      it('should throw', () => {
        expect(() => getModuleBinPath('some-module', 'cmd')).toThrow()
      })
    })
  })
  describe('When getting the node bin path', () => {
    const realProcessPlatform = process.platform
    const realProcessArch = process.arch
    beforeAll(() => {
      setVersion('1.0.0')
      setGlobalStoragePath('/globalStorage')
    })
    afterAll(() => {
      setVersion(null)
      setGlobalStoragePath(null)
    })
    describe('and the platform is Windows', () => {
      beforeEach(() => {
        Object.defineProperty(process, 'platform', {
          value: 'win32',
        })
        Object.defineProperty(process, 'arch', {
          value: 'x64',
        })
      })
      afterEach(() => {
        Object.defineProperty(process, 'platform', {
          value: realProcessPlatform,
        })
        Object.defineProperty(process, 'arch', {
          value: realProcessArch,
        })
      })
      it('should return the path to the Windows node bin', () => {
        expect(getNodeBinPath()).toBe(
          '/globalStorage/bin/node-v1.0.0-win-x64/node.exe'
        )
      })
    })
    describe('and the platform is MacOS', () => {
      beforeEach(() => {
        Object.defineProperty(process, 'platform', {
          value: 'darwin',
        })
        Object.defineProperty(process, 'arch', {
          value: 'arm64',
        })
      })
      afterEach(() => {
        Object.defineProperty(process, 'platform', {
          value: realProcessPlatform,
        })
        Object.defineProperty(process, 'arch', {
          value: realProcessArch,
        })
      })
      it('should return the path to the MacOS node bin', () => {
        expect(getNodeBinPath()).toBe(
          '/globalStorage/bin/node-v1.0.0-darwin-arm64/bin/node'
        )
      })
    })
  })
  describe('When joining env paths', () => {
    let realProcessPlatform = process.platform
    describe('and the platform is windows', () => {
      beforeAll(() => {
        Object.defineProperty(process, 'platform', {
          value: 'win32',
        })
      })
      afterAll(() => {
        Object.defineProperty(process, 'platform', {
          value: realProcessPlatform,
        })
      })
      it('should join the paths using a semi-colon as separator', () => {
        expect(
          joinEnvPaths('usr/bin', '/path/to/folder', '/path/to/another/folder')
        ).toBe('usr/bin;/path/to/folder;/path/to/another/folder')
      })
    })
    describe('and the platform is not windows', () => {
      beforeAll(() => {
        Object.defineProperty(process, 'platform', {
          value: 'darwin',
        })
      })
      afterAll(() => {
        Object.defineProperty(process, 'platform', {
          value: realProcessPlatform,
        })
      })
      it('should join the paths using a colon as separator', () => {
        expect(
          joinEnvPaths('usr/bin', '/path/to/folder', '/path/to/another/folder')
        ).toBe('usr/bin:/path/to/folder:/path/to/another/folder')
      })
    })
  })
  describe('When getting the file paths of a folder', () => {
    describe('and the folder has two files', () => {
      beforeEach(() => {
        fsReaddirSyncMock.mockReturnValue([
          'file1.txt',
          'file2.txt',
        ] as unknown as Dirent[])
        fsLstatSyncMock.mockReturnValue({
          isDirectory: () => false,
          isFile: () => true,
        } as Stats)
      })
      it('should return the two files', () => {
        expect(getFilePaths('/some/folder')).toEqual([
          '/some/folder/file1.txt',
          '/some/folder/file2.txt',
        ])
      })
    })
    describe('and the folder has a subfolder', () => {
      beforeEach(() => {
        fsReaddirSyncMock.mockReturnValueOnce([
          'file1.txt',
          'file2.txt',
          'subfolder',
        ] as unknown as Dirent[])
        fsLstatSyncMock.mockReturnValueOnce({
          isDirectory: () => false,
          isFile: () => true,
        } as Stats)
        fsLstatSyncMock.mockReturnValueOnce({
          isDirectory: () => false,
          isFile: () => true,
        } as Stats)
        fsLstatSyncMock.mockReturnValueOnce({
          isDirectory: () => true,
          isFile: () => false,
        } as Stats)
        fsReaddirSyncMock.mockReturnValueOnce([
          'subfile1.txt',
          'subfile2.txt',
        ] as unknown as Dirent[])
        fsLstatSyncMock.mockReturnValueOnce({
          isDirectory: () => false,
          isFile: () => true,
        } as Stats)
        fsLstatSyncMock.mockReturnValueOnce({
          isDirectory: () => false,
          isFile: () => true,
        } as Stats)
      })
      it('should include the files in the subfolder', () => {
        expect(getFilePaths('/some/folder')).toEqual([
          '/some/folder/file1.txt',
          '/some/folder/file2.txt',
          '/some/folder/subfolder/subfile1.txt',
          '/some/folder/subfolder/subfile2.txt',
        ])
      })
    })
  })
})
