import { ChildReponse, SpanwedChild, spawn } from './spawn'
import { ChildProcess } from 'child_process'

/********************************************************
                          Mocks
*********************************************************/

import crossSpawn from 'cross-spawn'
jest.mock('cross-spawn')
const crossSpawnMock = crossSpawn as jest.MockedFunction<typeof crossSpawn>

import future, { IFuture } from 'fp-future'
jest.mock('fp-future')
const futureMock = future as jest.MockedFunction<typeof future<void>>

import isRunning from 'is-running'
jest.mock('is-running')
const isRunningMock = isRunning as jest.MockedFunction<typeof isRunning>

import { bind } from './log'
jest.mock('./log')
const bindMock = bind as jest.MockedFunction<typeof bind>

import { getCwd, getModuleBinPath, getNodeBinPath, joinEnvPaths } from './path'
jest.mock('./path')
const getCwdMock = getCwd as jest.MockedFunction<typeof getCwd>
const getModuleBinPathMock = getModuleBinPath as jest.MockedFunction<
  typeof getModuleBinPath
>
const getNodeBinPathMock = getNodeBinPath as jest.MockedFunction<
  typeof getNodeBinPath
>
const joinEnvPathsMock = joinEnvPaths as jest.MockedFunction<
  typeof joinEnvPaths
>

let promiseMock: ReturnType<typeof mockFuture>
function mockFuture() {
  return {
    then: jest.fn(),
    finally: jest.fn(),
    catch: jest.fn(),
    reject: jest.fn(),
    resolve: jest.fn(),
  }
}

let childMock: ReturnType<typeof mockChild>
let childEmit: (str: string) => Promise<void>
function mockChild() {
  return {
    pid: 1,
    on: jest.fn(),
    stdin: {
      write: jest.fn(),
    },
    stdout: {
      pipe: jest.fn(),
      on: jest
        .fn()
        .mockImplementation(
          (_event: string, cb: (data: Buffer) => Promise<void>) => {
            childEmit = (str: string) => cb(Buffer.from(str))
          }
        ),
    },
    stderr: {
      pipe: jest.fn(),
      on: jest.fn(),
    },
    kill: jest.fn(),
    killed: false,
  }
}

/********************************************************
                          Tests
*********************************************************/

describe('When spawning a child process', () => {
  let realProcessEnv = process.env
  beforeEach(() => {
    promiseMock = mockFuture()
    childMock = mockChild()
    futureMock.mockReturnValue(promiseMock as unknown as IFuture<void>)
    crossSpawnMock.mockReturnValue(childMock as unknown as ChildProcess)
    getCwdMock.mockReturnValue('/path/to/project')
    getModuleBinPathMock.mockReturnValue(
      '/path/to/project/node_modules/npm/bin/npm'
    )
    getNodeBinPathMock.mockReturnValue('/globalStorage/bin/node')
    bindMock.mockReturnValue()
    joinEnvPathsMock.mockImplementation((...paths) => paths.join(';'))
    isRunningMock.mockReturnValue(false)
    Object.defineProperty(process, 'env', {
      value: {
        PATH: '/usr/bin',
      },
    })
    jest.useFakeTimers()
  })
  afterEach(() => {
    futureMock.mockReset()
    crossSpawnMock.mockReset()
    getCwdMock.mockReset()
    bindMock.mockReset()
    getModuleBinPathMock.mockReset()
    getNodeBinPathMock.mockReset()
    joinEnvPathsMock.mockReset()
    isRunningMock.mockReset()
    Object.defineProperty(process, 'env', {
      value: realProcessEnv,
    })
    jest.useRealTimers()
  })
  it('should use the command provided', () => {
    spawn('id', 'command')
    expect(crossSpawnMock).toHaveBeenCalledWith(
      'command',
      expect.any(Array),
      expect.objectContaining({ shell: true })
    )
  })
  it('should use the arguments provided', () => {
    spawn('id', 'command', ['arg0', 'arg1'])
    expect(crossSpawnMock).toHaveBeenCalledWith(
      expect.any(String),
      ['arg0', 'arg1'],
      expect.any(Object)
    )
  })
  it('should spawn the child process in shell mode', () => {
    spawn('id', 'command')
    expect(crossSpawnMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Array),
      expect.objectContaining({ shell: true })
    )
  })
  it('should use the projects current working directory', () => {
    spawn('id', 'command')
    expect(crossSpawnMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Array),
      expect.objectContaining({ cwd: '/path/to/project' })
    )
  })
  it('should add the node and npm binaries to the PATH', () => {
    spawn('id', 'command')
    expect(crossSpawnMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Array),
      expect.objectContaining({
        env: {
          PATH: '/usr/bin;/globalStorage/bin;/path/to/project/node_modules/npm/bin',
        },
      })
    )
  })
  it('should pipe the outputs from the child process to the ones on the parent process', () => {
    spawn('id', 'command')
    expect(childMock.stdout.pipe).toHaveBeenCalledWith(process.stdout)
    expect(childMock.stderr.pipe).toHaveBeenCalledWith(process.stderr)
  })
  it('should listen to data on outputs from the child process', () => {
    spawn('id', 'command')
    expect(childMock.stdout.on).toHaveBeenCalledWith(
      'data',
      expect.any(Function)
    )
    expect(childMock.stderr.on).toHaveBeenCalledWith(
      'data',
      expect.any(Function)
    )
  })
  it('should be alive', () => {
    const spawned = spawn('id', 'command')
    expect(spawned.alive()).toBe(true)
  })
  describe('and using a custom current working directory', () => {
    it('should spawn the child process on the custom current working directory', () => {
      spawn('id', 'command', [], { cwd: '/custom/path' })
      expect(crossSpawnMock).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Array),
        expect.objectContaining({ cwd: '/custom/path' })
      )
    })
  })
  describe('and using a custom env', () => {
    it('should spawn the child process with the custom env', () => {
      spawn('id', 'command', [], { env: { FOO: 'bar' } })
      expect(crossSpawnMock).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Array),
        expect.objectContaining({
          env: expect.objectContaining({ FOO: 'bar' }),
        })
      )
    })
    it('should add the node and npm binaries to the custom PATH if provided', () => {
      spawn('id', 'command', [], {
        env: { PATH: '/custom/path' },
      })
      expect(crossSpawnMock).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Array),
        expect.objectContaining({
          env: {
            PATH: '/custom/path;/globalStorage/bin;/path/to/project/node_modules/npm/bin',
          },
        })
      )
    })
  })
  describe('and the child process is closed with a non-zero exit code', () => {
    beforeEach(() => {
      childMock.on.mockImplementation((_event, cb) => cb(1))
    })
    afterEach(() => {
      childMock.on.mockReset()
    })
    it('should reject the promise', () => {
      spawn('id', 'command')
      expect(promiseMock.reject).toHaveBeenCalledWith(
        new Error('Error: process "command" exited with code "1".')
      )
    })
  })
  describe('and the child process is closed with exit code zero', () => {
    beforeEach(() => {
      childMock.on.mockImplementation((_event, cb) => cb(0))
    })
    afterEach(() => {
      childMock.on.mockReset()
    })
    it('should resolve the promise', () => {
      spawn('id', 'command')
      expect(promiseMock.resolve).toHaveBeenCalledTimes(1)
    })
  })
  describe('and the child process has a listener', () => {
    let spawned: SpanwedChild
    let handler: jest.MockedFunction<
      (data?: string | undefined) => ChildReponse
    >
    let handlerIndex: number
    beforeEach(() => {
      spawned = spawn('id', 'command')
      handler = jest.fn()
      handlerIndex = spawned.on(/test/gi, handler)
    })
    afterEach(() => {
      handler.mockReset()
    })
    it('should return the listener index once added', () => {
      expect(handlerIndex).toBe(0)
    })
    describe('and the child process emits data that matches the pattern of the listener', () => {
      it('should handle the data if it matches the pattern of the handler', async () => {
        await childEmit('test')
        expect(handler).toHaveBeenCalledTimes(1)
      })
      describe('and the handler returns a string', () => {
        beforeEach(() => {
          handler.mockReturnValue('answer')
        })
        afterEach(() => {
          handler.mockReset()
        })
        it('should write it to the standard input of the child process', async () => {
          await childEmit('test')
          expect(childMock.stdin.write).toHaveBeenCalledWith('answer')
        })
      })
      describe('and the handler returns an array of strings', () => {
        beforeEach(() => {
          handler.mockReturnValue(['answer1', 'answer2'])
        })
        afterEach(() => {
          handler.mockReset()
        })
        it('should write each result to the standard input of the child process', async () => {
          await childEmit('test')
          expect(childMock.stdin.write).toHaveBeenCalledTimes(2)
          expect(childMock.stdin.write).toHaveBeenCalledWith('answer1')
          expect(childMock.stdin.write).toHaveBeenCalledWith('answer2')
        })
      })
      describe('and the handler returns a promise that resolves to a string', () => {
        beforeEach(() => {
          handler.mockResolvedValue('answer')
        })
        afterEach(() => {
          handler.mockReset()
        })
        it('should await for the promise and write the resolved value to the standard input of the child process', async () => {
          await childEmit('test')
          expect(childMock.stdin.write).toHaveBeenCalledWith('answer')
        })
      })
      describe('and the listener has been disabled', () => {
        beforeEach(() => {
          spawned.off(handlerIndex)
        })
        it('should not handle the data', async () => {
          await childEmit('test')
          expect(handler).not.toHaveBeenCalled()
        })
      })
    })
    describe('and the child process emits data that matches the listener pattern twice', () => {
      it('should handle the data twice', async () => {
        await childEmit('test')
        await childEmit('test')
        expect(handler).toHaveBeenCalledTimes(2)
      })
    })
    describe('and the child process emits data that does not match the pattern of the listener', () => {
      it('should handle ignore the data if it does not match the pattern of the handler', async () => {
        await childEmit('not a match')
        expect(handler).not.toHaveBeenCalled()
      })
    })
  })
  describe('and the child process has a listener that only needs to handle data once', () => {
    let spawned: SpanwedChild
    let handler: jest.MockedFunction<
      (data?: string | undefined) => ChildReponse
    >
    beforeEach(() => {
      spawned = spawn('id', 'command')
      handler = jest.fn()
      spawned.once(/test/gi, handler)
    })
    afterEach(() => {
      handler.mockReset()
    })
    describe('and the child process emits data that matches the listener pattern twice', () => {
      it('should only handle the data once', async () => {
        await childEmit('test')
        await childEmit('test')
        expect(handler).toHaveBeenCalledTimes(1)
      })
    })
  })
  describe('and waiting for the child process to finish', () => {
    it('should return the promise', () => {
      const child = spawn('id', 'command')
      expect(child.wait()).toBe(promiseMock)
    })
  })
  describe('and waiting for patterns', () => {
    let child: SpanwedChild
    let promise: Promise<string>
    beforeEach(() => {
      child = spawn('id', 'command')
      promise = child.waitFor(/success/gi, /error/gi)
    })
    describe('and the child process emits data that matches the success pattern', () => {
      it('should resolve the promise with the matched data', async () => {
        await childEmit('this is a success message')
        await expect(promise).resolves.toBe('this is a success message')
      })
    })
    describe('and the child process emits data that matches the failure pattern', () => {
      it('should reject the promise with the matched data', async () => {
        await childEmit('this is an error message')
        await expect(promise).rejects.toThrow('this is an error message')
      })
    })
  })
  describe('and the child process is killed', () => {
    it('should kill the child process with a signal 9', () => {
      const child = spawn('id', 'command')
      child.kill()
      expect(childMock.kill).toHaveBeenCalledWith(9)
    })
    describe('and the process can be gracefully killed', () => {
      beforeEach(() => {
        isRunningMock.mockReturnValue(false)
      })
      afterEach(() => {
        isRunningMock.mockReset()
      })
      it('should wait for the process to be gracefully killed before resolving the promise', () => {
        const child = spawn('id', 'command')
        const promise = child.kill()
        jest.advanceTimersByTime(100)
        expect(promise).resolves.toBe(void 0)
      })
      it('should disable all listeners', async () => {
        const child = spawn('id', 'command')
        const handler = jest.fn()
        child.on(/test/gi, handler)
        child.kill()
        jest.advanceTimersByTime(100)
        await childEmit('test')
        expect(handler).not.toHaveBeenCalled()
      })
      it('should throw if listeners are added after process is killed', async () => {
        const child = spawn('id', 'command')
        child.kill()
        jest.advanceTimersByTime(100)
        expect(() => child.on(/test/gi, jest.fn())).toThrow()
      })
      it('should resolve the promise without waiting if the process was already killed', async () => {
        const child = spawn('id', 'command')
        // needs timers to advance in order to resolve
        const promiseNeedsTimers = child.kill()
        jest.advanceTimersByTime(100)
        expect(promiseNeedsTimers).resolves.toBe(void 0)
        // it doesn't need timers to advance after it is killed
        const promiseDontNeedTimers = child.kill()
        expect(promiseDontNeedTimers).resolves.toBe(void 0)
      })
    })
    describe('and the process can not be gracefully killed', () => {
      beforeEach(() => {
        isRunningMock.mockReturnValue(true)
      })
      afterEach(() => {
        isRunningMock.mockReset()
      })
      it('should forcefully kill the child process after 5 seconds', () => {
        const child = spawn('id', 'command')
        const promise = child.kill()
        jest.advanceTimersByTime(5000)
        expect(promise).resolves.toBe(void 0)
      })
    })
  })
})
