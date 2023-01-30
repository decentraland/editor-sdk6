import { ChildProcess } from 'child_process'
import path from 'path'
import crossSpawn from 'cross-spawn'
import treeKill from 'tree-kill'
import future from 'fp-future'
import { Readable } from 'stream'
import isRunning from 'is-running'
import { bind, log } from './log'
import { getModuleBinPath, getNodeBinPath, joinEnvPaths } from './path'
import { getCwd } from './workspace'

export type SpanwedChild = {
  id: string
  process: ChildProcess
  on: (pattern: RegExp, handler: (data?: string) => ChildReponse) => number
  once: (pattern: RegExp, handler: (data?: string) => ChildReponse) => number
  off: (index: number) => void
  wait: () => Promise<void>
  waitFor: (resolvePattern: RegExp, rejectPattern?: RegExp) => Promise<string>
  kill: () => Promise<void>
  alive: () => boolean
}

export type SpawnOptions = {
  cwd?: string
  env?: Record<string, string>
}

export type ChildReponse = Thenable<string> | string[] | string | void

type Matcher = {
  pattern: RegExp
  handler: (data: string) => ChildReponse
  enabled: boolean
}

/**
 * Runs any command in a spanwed child process, provides helpers to wait for the process to finish, listen for outputs, send reponses, etc
 * @param command The command
 * @param args The arguments for the command
 * @param options Options for the child process spawned
 * @returns SpanwedChild
 */
export function spawn(
  id: string,
  command: string,
  args: string[] = [],
  options: SpawnOptions = {}
): SpanwedChild {
  const { cwd = getCwd(), env = { ...process.env } } = options

  // status
  let isKilling = false
  let alive = true

  const promise = future<void>()

  const matchers: Matcher[] = []

  const nodePath = path.dirname(getNodeBinPath())
  const npmPath = path.dirname(getModuleBinPath('npm', 'npm'))
  const newEnv = {
    ...env,
    PATH: joinEnvPaths(env.PATH, nodePath, npmPath),
  }

  const child = crossSpawn(command, args, {
    shell: true,
    cwd,
    env: newEnv,
  })

  log(`Spawning child process "${id}" with pid=${child.pid}`)

  child.stdout!.pipe(process.stdout)
  child.stderr!.pipe(process.stderr)

  child.on('close', (code) => {
    alive = false
    if (code !== 0 && code !== null) {
      promise.reject(
        new Error(`Error: process "${command}" exited with code "${code}".`)
      )
    } else {
      promise.resolve(void 0)
    }
  })

  function handleStream(stream: Readable) {
    stream.on('data', (data: Buffer) => handleData(data, matchers, child))
  }

  handleStream(child.stdout!)
  handleStream(child.stderr!)

  const spawned: SpanwedChild = {
    id,
    process: child,
    on: (pattern, handler) => {
      if (alive) {
        return matchers.push({ pattern, handler, enabled: true }) - 1
      }
      throw new Error('Process has been killed')
    },
    once: (pattern, handler) => {
      const index = spawned.on(pattern, (data) => {
        handler(data)
        spawned.off(index)
      })
      return index
    },
    off: (index) => {
      if (matchers[index]) {
        matchers[index].enabled = false
      }
    },
    wait: () => promise,
    waitFor: (resolvePattern, rejectPattern) =>
      new Promise((resolve, reject) => {
        spawned.once(resolvePattern, (data) => resolve(data!))
        if (rejectPattern) {
          spawned.once(rejectPattern, (data) => reject(new Error(data)))
        }
      }),
    kill: async () => {
      log(`Killing process "${id}" with pid=${child.pid}...`)
      // if child is being killed or already killed then return
      if (isKilling || !alive) return
      isKilling = true

      // create promise to kill child
      const promise = future<void>()

      // kill child gracefully
      treeKill(child.pid!)

      // child succesfully killed
      const die = (force: boolean = false) => {
        isKilling = false
        alive = false
        clearInterval(interval)
        clearTimeout(timeout)
        if (!child.killed) {
          const signal = force ? 'SIGKILL' : 'SIGTERM'
          log(
            `Sending signal=${signal} to process "${id}" with pid=${child.pid}`
          )
          treeKill(child.pid!, signal)
        }
        for (const matcher of matchers) {
          matcher.enabled = false
        }
        log(
          `Process "${id}" with pid=${child.pid} ${
            force ? 'forcefully' : 'gracefully'
          } killed`
        )
        promise.resolve()
      }

      // interval to check if child still running and flag it as dead when is not running anymore
      const interval = setInterval(() => {
        if (!child.pid || !isRunning(child.pid)) {
          die()
        }
      }, 100)

      // timeout to stop checking if child still running, kill it with fire
      const timeout = setTimeout(() => {
        if (alive) {
          die(true)
        }
      }, 5000)

      // return promise
      return promise
    },
    alive: () => alive,
  }

  // bind logs to output channel
  bind(spawned)

  return spawned
}

async function handleData(
  buffer: Buffer,
  matchers: Matcher[],
  child: ChildProcess
) {
  const data = buffer.toString('utf8')
  for (const { pattern, handler, enabled } of matchers) {
    if (!enabled) continue
    pattern.lastIndex = 0 // reset regexp
    if (pattern.test(data)) {
      const response = handler(data)
      switch (typeof response) {
        case 'string':
          child.stdin!.write(response)
          break
        case 'object': {
          if ('then' in response) {
            const value = await response
            child.stdin!.write(value)
          } else if (Array.isArray(response)) {
            for (const res of response) {
              child.stdin!.write(res)
            }
          }
          break
        }
        default: {
          break
        }
      }
    }
  }
}
