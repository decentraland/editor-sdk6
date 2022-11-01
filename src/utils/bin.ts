import { log } from './log'
import { getLocalBinPath } from './path'
import { spawn, SpawnOptions } from './spawn'

/**
 * Runs an command binary from the local modules
 * @param moduleName The name of the module that has the command
 * @param command The command, like 'dcl' or 'npm'
 * @param args The arguments for the command, like 'install' or 'start'
 * @param options Options for the child process spawned
 * @returns Promise<void>
 */
export function bin(
  moduleName: string,
  command: string,
  args: string[] = [],
  options: SpawnOptions = {}
) {
  const path = getLocalBinPath(moduleName, command)
  return spawn(path, args, options)
}
