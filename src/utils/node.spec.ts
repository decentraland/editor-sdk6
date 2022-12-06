import fs from 'fs'
import { checkBinaries, getVersion, resolveVersion, setVersion } from './node'
import { getGlobalBinPath, setGlobalStoragePath } from './path'

import { Readable } from 'stream'

class DummyBody extends Readable {
  done = false
  _read(_size: number): void {
    if (!this.done) {
      this.push('test')
      this.done = true
    } else {
      this.push(null)
    }
  }
  _destroy(): void {
    this.done = true
  }
}

import { getPackageJson } from './pkg'
jest.mock('./pkg')
const getPackageJsonMock = getPackageJson as jest.MockedFunction<
  typeof getPackageJson
>

import { log } from './log'
jest.mock('./log')
const logMock = log as jest.MockedFunction<typeof log>

import { sleep } from './sleep'
jest.mock('./sleep')
const sleepMock = sleep as jest.MockedFunction<typeof sleep>

import { track } from './analytics'
jest.mock('./analytics')
const trackMock = track as jest.MockedFunction<typeof track>

import fetch, { Headers, Response } from 'node-fetch'
jest.mock('node-fetch')
const fetchMock = fetch as jest.MockedFunction<typeof fetch>

import rimraf from 'rimraf'
jest.mock('rimraf')
const rimrafMock = rimraf as jest.MockedFunction<typeof rimraf>

jest.spyOn(fs, 'readdir')
const fsReaddirMock = fs.readdir as unknown as jest.MockedFunction<
  (
    path: fs.PathLike,
    callback: (err: NodeJS.ErrnoException | null, files: string[]) => void
  ) => void
>

jest.spyOn(fs, 'existsSync')
const fsExistsSyncMock = fs.existsSync as jest.MockedFunction<
  typeof fs.existsSync
>
jest.spyOn(fs, 'symlinkSync')
const fsSymlinkSyncMock = fs.symlinkSync as jest.MockedFunction<
  typeof fs.symlinkSync
>
jest.spyOn(fs, 'mkdirSync')
const fsMkdirSyncMock = fs.mkdirSync as jest.MockedFunction<typeof fs.mkdirSync>

describe('node', () => {
  beforeAll(() => {
    setGlobalStoragePath('/globalStorage')
  })
  afterEach(() => {
    logMock.mockReset()
  })
  describe('When getting the node version', () => {
    it('should throw if was not set already', () => {
      expect(() => getVersion()).toThrow(`Node version not set`)
    })
    describe('and is already set', () => {
      beforeEach(() => {
        setVersion('0.0.0-test')
      })
      it('should return the node version', () => {
        expect(getVersion()).toBe('0.0.0-test')
      })
    })
  })
  describe('When resolving the node version', () => {
    describe('and the engine version is invalid', () => {
      beforeEach(() => {
        getPackageJsonMock.mockReturnValueOnce({
          version: '0.0.0-test',
          engines: {
            node: 'invalid',
          },
        })
      })
      afterEach(() => {
        getPackageJsonMock.mockReset()
      })
      it('should throw', async () => {
        await expect(resolveVersion()).rejects.toThrow()
      })
    })
    describe('and the engine node version is valid', () => {
      beforeEach(() => {
        getPackageJsonMock.mockReturnValueOnce({
          version: '0.0.0-test',
          engines: {
            node: '16.0.0',
          },
        })
      })
      afterEach(() => {
        getPackageJsonMock.mockReset()
        logMock.mockReset()
      })
      it('should read distributions from file system', async () => {
        await resolveVersion()
        expect(fsReaddirMock).toHaveBeenCalledWith(
          getGlobalBinPath(),
          expect.any(Function)
        )
      })
      it('should log the required engine node version', async () => {
        await resolveVersion()
        expect(logMock).toHaveBeenCalledWith(`Node engine required: 16.0.0`)
      })
      describe('and there are no distributions installed', () => {
        beforeEach(() => {
          fsReaddirMock.mockImplementationOnce((_path, callback) => {
            callback(null, [])
          })
        })
        afterEach(() => {
          fsReaddirMock.mockReset()
        })
        describe('and there are no versions in Github', () => {
          beforeEach(() => {
            fetchMock.mockResolvedValueOnce({
              ok: true,
              json: jest.fn().mockResolvedValueOnce([]),
            } as any)
          })
          afterEach(() => {
            fetchMock.mockReset()
          })
          it('should use the engine node version', async () => {
            await expect(resolveVersion()).resolves.toBe('16.0.0')
          })
        })
        describe('and there are older versions in Github', () => {
          beforeEach(() => {
            fetchMock.mockResolvedValueOnce({
              ok: true,
              json: jest
                .fn()
                .mockResolvedValueOnce([
                  { name: '14.0.0' },
                  { name: '15.0.0' },
                ]),
            } as any)
          })
          afterEach(() => {
            fetchMock.mockReset()
          })
          it('should use the engine node version', async () => {
            await expect(resolveVersion()).resolves.toBe('16.0.0')
          })
        })
        describe('and there are newer versions in Github from different major', () => {
          beforeEach(() => {
            fetchMock.mockResolvedValueOnce({
              ok: true,
              json: jest
                .fn()
                .mockResolvedValueOnce([
                  { name: '17.0.0' },
                  { name: '18.0.0' },
                ]),
            } as any)
          })
          afterEach(() => {
            fetchMock.mockReset()
          })
          it('should use the engine node version', async () => {
            await expect(resolveVersion()).resolves.toBe('16.0.0')
          })
        })
        describe('and there are newer versions in Github from same major', () => {
          beforeEach(() => {
            fetchMock.mockResolvedValueOnce({
              ok: true,
              json: jest
                .fn()
                .mockResolvedValueOnce([
                  { name: '16.1.0' },
                  { name: '16.2.0' },
                ]),
            } as any)
          })
          afterEach(() => {
            fetchMock.mockReset()
          })
          it('should use the newest version from GitHub', async () => {
            await expect(resolveVersion()).resolves.toBe('16.2.0')
          })
          it('should log the latest version from GitHub', async () => {
            await resolveVersion()
            expect(logMock).toHaveBeenCalledWith(
              `Latest node version available: 16.2.0`
            )
          })
        })
        describe('and GitHub fails to respond', () => {
          beforeEach(() => {
            fetchMock.mockResolvedValueOnce({
              ok: false,
            } as any)
          })
          afterEach(() => {
            fetchMock.mockReset()
          })
          it('should use the engine node version', async () => {
            await expect(resolveVersion()).resolves.toBe('16.0.0')
          })
        })
      })
      describe('and there are distributions installed', () => {
        beforeEach(() => {
          fsReaddirMock.mockImplementationOnce((_path, callback) => {
            callback(null, [
              'node-v16.1.0-win-x64',
              'node-v16.0.8-win-x64',
              'node-v17.0.0-win-x64',
            ])
          })
        })
        afterEach(() => {
          fsReaddirMock.mockReset()
        })
        it('should log the latest version installed from the same major', async () => {
          await resolveVersion()
          expect(logMock).toHaveBeenCalledWith(
            `Latest node version installed: 16.1.0`
          )
        })
        describe('and there are no versions in Github', () => {
          beforeEach(() => {
            fetchMock.mockResolvedValueOnce({
              ok: true,
              json: jest.fn().mockResolvedValueOnce([]),
            } as any)
          })
          afterEach(() => {
            fetchMock.mockReset()
          })
          it('should use the newest version installed', async () => {
            await expect(resolveVersion()).resolves.toBe('16.1.0')
          })
        })
        describe('and there are older versions in Github', () => {
          beforeEach(() => {
            fetchMock.mockResolvedValueOnce({
              ok: true,
              json: jest
                .fn()
                .mockResolvedValueOnce([
                  { name: '14.0.0' },
                  { name: '15.0.0' },
                ]),
            } as any)
          })
          afterEach(() => {
            fetchMock.mockReset()
          })
          it('should use the newest version installed', async () => {
            await expect(resolveVersion()).resolves.toBe('16.1.0')
          })
        })
        describe('and there are newer versions in Github from different major', () => {
          beforeEach(() => {
            fetchMock.mockResolvedValueOnce({
              ok: true,
              json: jest
                .fn()
                .mockResolvedValueOnce([
                  { name: '17.0.0' },
                  { name: '18.0.0' },
                ]),
            } as any)
          })
          afterEach(() => {
            fetchMock.mockReset()
          })
          it('should use the newest version installed', async () => {
            await expect(resolveVersion()).resolves.toBe('16.1.0')
          })
        })
        describe('and there are newer versions in Github from same major', () => {
          beforeEach(() => {
            fetchMock.mockResolvedValueOnce({
              ok: true,
              json: jest
                .fn()
                .mockResolvedValueOnce([
                  { name: '16.1.0' },
                  { name: '16.2.0' },
                ]),
            } as any)
          })
          afterEach(() => {
            fetchMock.mockReset()
          })
          it('should use the newest version from GitHub', async () => {
            await expect(resolveVersion()).resolves.toBe('16.2.0')
          })
          it('should log the latest version from GitHub', async () => {
            await resolveVersion()
            expect(logMock).toHaveBeenCalledWith(
              `Latest node version available: 16.2.0`
            )
          })
        })
        describe('and GitHub fails to respond', () => {
          beforeEach(() => {
            fetchMock.mockResolvedValueOnce({
              ok: false,
            } as any)
          })
          afterEach(() => {
            fetchMock.mockReset()
          })
          it('should use the newest version installed', async () => {
            await expect(resolveVersion()).resolves.toBe('16.1.0')
          })
        })
      })
    })
  })
  describe('When checking the node binaries', () => {
    describe('and the platform is darwin', () => {
      const realProcessPlatform = process.platform
      beforeEach(() => {
        Object.defineProperty(process, 'platform', {
          value: 'darwin',
        })
      })
      afterEach(() => {
        Object.defineProperty(process, 'platform', {
          value: realProcessPlatform,
        })
      })
      describe('and distribution is already installed and linked', () => {
        beforeEach(() => {
          // check if distribution is installed
          fsExistsSyncMock.mockReturnValueOnce(true)
          // check if distribution is linked
          fsExistsSyncMock.mockReturnValueOnce(true)
        })
        afterEach(() => {
          fsExistsSyncMock.mockReset()
          fsSymlinkSyncMock.mockReset()
        })
        it('should skip both install and link steps', async () => {
          await checkBinaries()
          expect(fsSymlinkSyncMock).not.toHaveBeenCalled()
          expect(trackMock).toHaveBeenCalledTimes(2)
          expect(trackMock).toHaveBeenCalledWith(
            `node.check:request`,
            expect.objectContaining({
              distribution: expect.any(String),
              installed: true,
            })
          )
          expect(trackMock).toHaveBeenCalledWith(
            `node.check:success`,
            expect.objectContaining({
              distribution: expect.any(String),
              wasInstalled: true,
            })
          )
        })
      })
      describe('and distribution is already installed but not linked', () => {
        beforeEach(() => {
          // check if distribution is installed
          fsExistsSyncMock.mockReturnValueOnce(true)
          // check if distribution is linked
          fsExistsSyncMock.mockReturnValueOnce(false)
          fsSymlinkSyncMock.mockReturnValueOnce()
        })
        afterEach(() => {
          fsExistsSyncMock.mockReset()
          fsSymlinkSyncMock.mockReset()
        })
        it('should link the node binaries', async () => {
          await checkBinaries()
          expect(fsSymlinkSyncMock).toHaveBeenCalledWith(
            '/globalStorage/bin/node-v0.0.0-test-darwin-arm64/bin/node',
            '/globalStorage/node'
          )
        })
      })
      describe('and distribution is neither installed nor linked', () => {
        beforeEach(() => {
          setVersion('16.2.0')
          // check if distribution is installed
          fsExistsSyncMock.mockReturnValue(false)
          // check if has bin dir
          fsExistsSyncMock.mockReturnValue(false)
          // check if distribution is linked
          fsExistsSyncMock.mockReturnValueOnce(false)
          fsSymlinkSyncMock.mockReturnValueOnce()
          fsMkdirSyncMock.mockReturnValueOnce('')
          sleepMock.mockResolvedValueOnce(0)
          // mock and older distribution installed so it uninstalls it
          fsReaddirMock.mockImplementationOnce((_path, callback) => {
            callback(null, ['node-v16.1.0-win-x64'])
          })
          fetchMock.mockResolvedValueOnce({
            ok: true,
            body: new DummyBody(),
            headers: {
              get: jest.fn().mockReturnValueOnce(4), // "content-length" of 4 bytes (string "test")
            },
          } as any)
          // mock removal of old installed distribution
          rimrafMock.mockImplementationOnce((_path, cb) => cb(null))
          // mock removal of old linked distribution
          rimrafMock.mockImplementationOnce((_path, cb) => cb(null))
        })
        afterEach(() => {
          setVersion(null)
          fsExistsSyncMock.mockReset()
          fsSymlinkSyncMock.mockReset()
          fsMkdirSyncMock.mockReset()
          fsReaddirMock.mockReset()
          fetchMock.mockReset()
          rimrafMock.mockReset()
          sleepMock.mockReset()
        })
        it('should create the bin directory', async () => {
          await checkBinaries()
          expect(fsMkdirSyncMock).toHaveBeenCalledWith('/globalStorage/bin', {
            recursive: true,
          })
        })
        it('should uninstall the old distribution', async () => {
          await checkBinaries()
          expect(rimrafMock).toHaveBeenCalledWith(
            '/globalStorage/bin/node-v16.1.0-win-x64',
            expect.any(Function)
          )
        })
        it('should unlink the old distribution', async () => {
          await checkBinaries()
          expect(rimrafMock).toHaveBeenCalledWith(
            '/globalStorage/node',
            expect.any(Function)
          )
        })
        it('should link the node binaries', async () => {
          await checkBinaries()
          expect(fsSymlinkSyncMock).toHaveBeenCalledWith(
            '/globalStorage/bin/node-v16.2.0-darwin-arm64/bin/node',
            '/globalStorage/node'
          )
        })
      })
    })
  })
})
