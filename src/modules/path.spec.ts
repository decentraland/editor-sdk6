import * as vscode from 'vscode'
import {
  getCwd,
  getExtensionPath,
  getGlobalStoragePath,
  getModuleBinPath,
  getScene,
  hasNodeModules,
  isDCL,
  isEmpty,
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

import { getPackageJson } from './pkg'
jest.mock('./pkg')
const getPackageJsonMock = getPackageJson as jest.MockedFunction<
  typeof getPackageJson
>

import fs from 'fs'
jest.mock('fs')
const fsReadFileSyncMock = fs.readFileSync as jest.MockedFunction<
  typeof fs.readFileSync
>
const fsReaddirSyncMock = fs.readdirSync as jest.MockedFunction<
  typeof fs.readdirSync
>
const fsExistsSyncMock = fs.existsSync as jest.MockedFunction<
  typeof fs.existsSync
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
  describe('When getting the current working directory', () => {
    it('should return the current working directory for the workspace', () => {
      expect(getCwd()).toBe('/path/to/workspace')
    })
    describe('and there is not current workspace', () => {
      let realWorkspaceFolders = vscode.workspace
        .workspaceFolders as vscode.WorkspaceFolder[]
      beforeAll(() => {
        ;(vscode.workspace.workspaceFolders as vscode.WorkspaceFolder[]) = []
      })
      afterAll(() => {
        ;(vscode.workspace.workspaceFolders as vscode.WorkspaceFolder[]) =
          realWorkspaceFolders
      })
      it('should throw', () => {
        expect(() => getCwd()).toThrow()
      })
    })
  })
  describe('When getting the scene', () => {
    beforeEach(() => {
      fsReadFileSyncMock.mockReturnValue('{ "name": "A scene" }')
    })
    afterEach(() => {
      fsReadFileSyncMock.mockReset()
    })
    it('should read the scene json file from the file system', () => {
      getScene()
      expect(fsReadFileSyncMock).toHaveBeenCalledWith(
        '/path/to/workspace/scene.json',
        'utf8'
      )
    })
    it('should return the parsed scene', () => {
      expect(getScene()).toEqual({ name: 'A scene' })
    })
  })
  describe('When checking if a workspace is a DCL project', () => {
    describe('and the workspace has a scene.json', () => {
      beforeEach(() => {
        fsReadFileSyncMock.mockReturnValue('{ "name": "A scene" }')
      })
      afterEach(() => {
        fsReadFileSyncMock.mockReset()
      })
      it('should read the scene json file from the file system', () => {
        expect(isDCL()).toBe(true)
      })
    })
    describe('and the workspace does not have a scene.json', () => {
      beforeEach(() => {
        fsReadFileSyncMock.mockImplementation(() => {
          throw new Error('Not found')
        })
      })
      afterEach(() => {
        fsReadFileSyncMock.mockReset()
      })
      it('should read the scene json file from the file system', () => {
        expect(isDCL()).toBe(false)
      })
    })
  })
  describe('When checking if a workspace is empty', () => {
    describe('and the workspace has files', () => {
      beforeEach(() => {
        fsReaddirSyncMock.mockReturnValue(['scene.json'] as any[])
      })
      afterEach(() => {
        fsReaddirSyncMock.mockReset()
      })
      it('should return false', () => {
        expect(isEmpty()).toBe(false)
      })
    })
    describe('and the workspace does not have files', () => {
      beforeEach(() => {
        fsReaddirSyncMock.mockReturnValue([])
      })
      afterEach(() => {
        fsReaddirSyncMock.mockReset()
      })
      it('should return true', () => {
        expect(isEmpty()).toBe(true)
      })
    })
    describe('and the files list can not be retrieved', () => {
      beforeEach(() => {
        fsReaddirSyncMock.mockImplementation(() => {
          throw new Error('Something went wrong')
        })
      })
      afterEach(() => {
        fsReaddirSyncMock.mockReset()
      })
      it('should return false', () => {
        expect(isEmpty()).toBe(false)
      })
    })
  })
  describe('When checking if a workspace has a node_modules directory', () => {
    describe('and the workspace has node_modules', () => {
      beforeEach(() => {
        fsExistsSyncMock.mockReturnValue(true)
      })
      afterEach(() => {
        fsExistsSyncMock.mockReset()
      })
      it('should return true', () => {
        expect(hasNodeModules()).toBe(true)
      })
    })
    describe('and the workspace does not have a node_modules directory', () => {
      beforeEach(() => {
        fsExistsSyncMock.mockReturnValue(false)
      })
      afterEach(() => {
        fsExistsSyncMock.mockReset()
      })
      it('should return false', () => {
        expect(hasNodeModules()).toBe(false)
      })
    })
    describe('and it can be checked if the node_modules directory exists', () => {
      beforeEach(() => {
        fsExistsSyncMock.mockImplementation(() => {
          throw new Error('Something went wrong')
        })
      })
      afterEach(() => {
        fsExistsSyncMock.mockReset()
      })
      it('should return false', () => {
        expect(hasNodeModules()).toBe(false)
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
})
