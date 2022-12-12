import { bin } from './bin'
import { setGlobalStoragePath, setExtensionPath } from './path'

/********************************************************
                          Mocks
*********************************************************/

const childMock = {} as SpanwedChild

import { getPackageJson } from './pkg'
jest.mock('./pkg')
const getPackageJsonMock = getPackageJson as jest.MockedFunction<
  typeof getPackageJson
>

import { SpanwedChild, spawn } from './spawn'
jest.mock('./spawn')
const spawnMock = spawn as jest.MockedFunction<typeof spawn>

/********************************************************
                          Tests
*********************************************************/

describe('bin', () => {
  const realProcessEnv = process.platform
  beforeEach(() => {
    spawnMock.mockImplementationOnce(() => childMock)
    setGlobalStoragePath('/globalStorage')
    setExtensionPath('/extension')
    getPackageJsonMock.mockReturnValueOnce({
      version: '0.0.0-test',
      engines: {
        node: '0.0.0-test',
      },
      bin: {
        dcl: 'index.js',
      },
    })
    Object.defineProperty(process, 'platform', {
      value: 'darwin',
    })
  })
  afterEach(() => {
    spawnMock.mockReset()
    setGlobalStoragePath(null)
    setExtensionPath(null)
    getPackageJsonMock.mockReset()
    Object.defineProperty(process, 'platform', {
      value: realProcessEnv,
    })
  })
  describe("When calling a node module's binary", () => {
    it('should spawn a child process', () => {
      const child = bin('decentraland', 'dcl')
      expect(child).toBe(childMock)
    })
    it("should create the id of the process using the module's CLI + command", () => {
      bin('decentraland', 'dcl', ['start'])
      expect(spawn).toBeCalledWith(
        'dcl start',
        expect.any(String),
        expect.any(Array),
        expect.any(Object)
      )
    })
    it('should use the path to the node binaries in the global storage', () => {
      bin('decentraland', 'dcl', ['start'])
      expect(spawn).toBeCalledWith(
        expect.any(String),
        '/globalStorage/node',
        expect.any(Array),
        expect.any(Object)
      )
    })
    it("should pass the path to the node module's bin file as the first argument of the child process", () => {
      bin('decentraland', 'dcl', ['start'])
      expect(spawn).toBeCalledWith(
        expect.any(String),
        expect.any(String),
        ['/extension/node_modules/decentraland/index.js', expect.any(String)],
        expect.any(Object)
      )
    }),
      it('should pass the arguments in the array as the rest of the arguments of the child process', () => {
        bin('decentraland', 'dcl', ['start', '-p', '3000'])
        expect(spawn).toBeCalledWith(
          expect.any(String),
          expect.any(String),
          [expect.any(String), 'start', '-p', '3000'],
          expect.any(Object)
        )
      }),
      it('should use the CWD passed in the options to spawn the child process', () => {
        bin('decentraland', 'dcl', ['start'], {
          cwd: '/some-path',
        })
        expect(spawn).toBeCalledWith(
          expect.any(String),
          expect.any(String),
          expect.any(Array),
          {
            cwd: '/some-path',
          }
        )
      })
    it('should the env passed in the options to spawn the child process', () => {
      bin('decentraland', 'dcl', ['start'], {
        env: {
          FOO: 'bar',
        },
      })
      expect(spawn).toBeCalledWith(
        expect.any(String),
        expect.any(String),
        expect.any(Array),
        {
          env: {
            FOO: 'bar',
          },
        }
      )
    })
    it('remove empty arguments', () => {
      bin('decentraland', 'dcl', ['start', '', '-p', '3000', ''])
      expect(spawn).toBeCalledWith(
        expect.any(String),
        expect.any(String),
        [expect.any(String), 'start', '-p', '3000'],
        expect.any(Object)
      )
    })
    it('work with no arguments', () => {
      bin('decentraland', 'dcl')
      expect(spawn).toBeCalledWith(
        'dcl',
        expect.any(String),
        [expect.any(String)],
        expect.any(Object)
      )
    })
    describe('and the path to the node binaries has white spaces', () => {
      beforeEach(() => {
        setGlobalStoragePath('/globalStorage with white spaces')
      })
      afterEach(() => {
        setGlobalStoragePath(null)
      })
      it('should escape the white spaces', () => {
        bin('decentraland', 'dcl')
        expect(spawn).toBeCalledWith(
          expect.any(String),
          '/globalStorage\\ with\\ white\\ spaces/node',
          [expect.any(String)],
          expect.any(Object)
        )
      })
    })
    describe('and the platform is windows', () => {
      beforeEach(() => {
        Object.defineProperty(process, 'platform', {
          value: 'win32',
        })
      })
      afterEach(() => {
        Object.defineProperty(process, 'platform', {
          value: realProcessEnv,
        })
      })
      it('should use the .cmd shim', () => {
        bin('decentraland', 'dcl')
        expect(spawn).toBeCalledWith(
          expect.any(String),
          '/globalStorage/node.cmd',
          [expect.any(String)],
          expect.any(Object)
        )
      })
    })
  })
})
