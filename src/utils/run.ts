import { getLocalBinPath } from './path'
import { spawn, SpawnOptions } from './spawn'

/**
 * Runs an npm command binary from the local binaries
 * @param command The command, like 'dcl' or 'npm'
 * @param args The arguments for the command, like 'install' or 'start'
 * @param options Options for the child process spawned
 * @returns Promise<void>
 */
export function exec(
  command: string,
  args: string[] = [],
  options: SpawnOptions = {}
) {
  const path = getLocalBinPath(command)
  return spawn(path, args, options)
}
