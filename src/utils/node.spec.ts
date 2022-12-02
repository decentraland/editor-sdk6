import fs from 'fs'
import { getVersion, resolveVersion, setVersion } from './node'
import { getGlobalBinPath, setGlobalStoragePath } from './path'

import { getPackageJson } from './pkg'
jest.mock('./pkg')
const getPackageJsonMock = getPackageJson as jest.MockedFunction<
  typeof getPackageJson
>

import { log } from './log'
jest.mock('./log')
const logMock = log as jest.MockedFunction<typeof log>

import fetch from 'node-fetch'
jest.mock('node-fetch')
const fetchMock = fetch as jest.MockedFunction<typeof fetch>

jest.spyOn(fs, 'readdir')
const fsReaddirMock = fs.readdir as unknown as jest.MockedFunction<
  (
    path: fs.PathLike,
    callback: (err: NodeJS.ErrnoException | null, files: string[]) => void
  ) => void
>

describe('node', () => {
  beforeAll(() => {
    setGlobalStoragePath('/globalStorage')
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
            callback(null, ['node-v16.1.0-win-x64', 'node-v16.0.8-win-x64'])
          })
        })
        afterEach(() => {
          fsReaddirMock.mockReset()
        })
        it('should log the latest version installed', async () => {
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
})
