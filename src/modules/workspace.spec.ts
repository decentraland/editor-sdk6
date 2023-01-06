import * as vscode from 'vscode'

import { getCwd, getScene, hasNodeModules, isDCL, isEmpty } from './workspace'

/********************************************************
                          Mocks
*********************************************************/

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

describe('workspace', () => {
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
})
