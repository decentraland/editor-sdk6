import { ChildProcess } from 'child_process'
import crossSpawn from 'cross-spawn'
import future from 'fp-future'
import { Readable } from 'stream'
import isRunning from 'is-running'
import { bind, log } from './log'
import { getCwd } from './path'

export type SpanwedChild = {
  id: string
  process: ChildProcess
  on: (pattern: RegExp, handler: (data?: string) => ChildReponse) => number
  once: (pattern: RegExp, handler: (data?: string) => ChildReponse) => number
  off: (index: number) => void
  wait: () => Promise<void>
  waitFor: (resolvePattern: RegExp, rejectPattern?: RegExp) => Promise<void>
  kill: () => Promise<void>
  alive: () => boolean
}

export type SpawnOptions = {
  cwd?: string
  env?: Record<string, string>
}

type ChildReponse = Thenable<string> | string[] | string | void

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
  args: string[],
  options: SpawnOptions = {}
): SpanwedChild {
  const { cwd = getCwd(), env = { ...process.env } } = options

  const promise = future<void>()

  const matchers: Matcher[] = []

  const child = crossSpawn(command, args, {
    shell: true,
    cwd,
    env,
  })

  child.stdout!.pipe(process.stdout)
  child.stderr!.pipe(process.stderr)

  child.on('close', (code) => {
    if (code !== 0 && code !== null) {
      promise.reject(new Error(`Error: npm exited with code "${code}".`))
    } else {
      promise.resolve(void 0)
    }
  })

  function handleStream(stream: Readable) {
    stream.on('data', (data) => handleData(data, matchers, child))
  }

  handleStream(child.stdout!)
  handleStream(child.stderr!)

  let killed = false
  let alive = true

  const spawned: SpanwedChild = {
    id,
    process: child,
    on: (pattern, handler) =>
      matchers.push({ pattern, handler, enabled: true }),
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
        spawned.once(resolvePattern, () => resolve())
        if (rejectPattern) {
          spawned.once(rejectPattern, (data) => reject(new Error(data)))
        }
      }),
    kill: async () => {
      log(`Killing process "${id}"...`)
      // if child already killed, return
      if (killed) return
      killed = true

      // create promise to kill child
      const promise = future<void>()

      // kill child gracefully
      child.kill(9)

      // child succesfully killed
      const die = () => {
        alive = false
        clearInterval(interval)
        clearTimeout(timeout)
        if (!child.killed) {
          child.kill()
        }
        promise.resolve()
      }

      // interval to check if child still running and flag it as dead when is not running anymore
      const interval = setInterval(() => {
        if (!child.pid || !isRunning(child.pid)) {
          log(`Process "${id}" gracefully killed`)
          die()
        }
      }, 100)

      // timeout to stop checking if child still running, kil it with fire
      const timeout = setTimeout(() => {
        if (alive) {
          log(`Process "${id}" forcefully killed`)
          die()
        }
      }, 5000)

      // return promise
      return promise
    },
    alive: () => alive
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
    if (pattern.test(data)) {
      const response = handler(data)
      switch (typeof response) {
        case 'string':
          child.stdin!.write(response)
          break
        case 'object': {
          if ('then' in response) {
            child.stdin!.write(await response)
          } else if (Array.isArray(response)) {
            for (const res in response) {
              child.stdin!.write(res)
            }
          }
        }
        default: {
          break
        }
      }
    }
  }
}
