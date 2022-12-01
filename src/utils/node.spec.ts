import fs from 'fs'
import { getVersion, resolveVersion, setVersion } from './node'

import { getPackageJson } from './pkg'
jest.mock('./pkg')
const getPackageJsonMock = getPackageJson as jest.MockedFunction<
  typeof getPackageJson
>

jest.spyOn(fs, 'readdir')
const fsReaddirMock = fs.readdir as jest.MockedFunction<typeof fs.readdir>

describe('node', () => {
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
    describe('and ', () => {})
  })
})
