import crossSpawn from 'cross-spawn'
import future from 'fp-future'
import { getCwd } from './path'

export type SpawnOptions = {
  cwd?: string
  env?: Record<string, string>
}

/**
 * Runs any command in a spanwed child process
 * @param command The command
 * @param args The arguments for the command
 * @param options Options for the child process spawned
 * @returns Promise<void>
 */
export async function spawn(
  command: string,
  args: string[],
  options: SpawnOptions = {}
) {
  const { cwd = getCwd(), env = { ...process.env } } = options

  const promise = future<void>()

  const child = crossSpawn(command, args, {
    shell: true,
    cwd,
    env,
  })

  child.stdout!.pipe(process.stdout)
  child.stderr!.pipe(process.stderr)

  child.on('close', (code) => {
    if (code !== 0) {
      promise.reject(new Error(`Error: npm exited with code "${code}".`))
    } else {
      promise.resolve(void 0)
    }
  })

  return promise
}
