import { getModuleBinPath, getNodeBinPath } from './path'
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
  args: (string | undefined)[] = [],
  options: SpawnOptions = {}
) {
  const node = getNodeBinPath().replace(/\s/g, "\\ ") // fix whitespaces 
  const bin = getModuleBinPath(moduleName, command)
  return spawn(node, [bin, ...args.filter((arg: string | undefined) => !!arg) as string[]], options)
}