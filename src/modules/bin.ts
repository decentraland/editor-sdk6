import fs from 'fs'
import cmdShim from 'cmd-shim'
import { fixWhiteSpaces, getModuleBinPath, getNodeCmdPath } from './path'
import { spawn, SpawnOptions } from './spawn'
import { log } from './log'

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
  const node = fixWhiteSpaces(getNodeCmdPath())
  const bin = getModuleBinPath(moduleName, command)
  return spawn(
    args[0] ? `${command} ${args[0]}` : command,
    node,
    [bin, ...(args.filter((arg: string | undefined) => !!arg) as string[])],
    options
  )
}

/**
 * Creates either a symlink (unix) or a command shim (windows) from a command file to a binary file
 */
export async function link(cmdPath: string, binPath: string) {
  log(`Linking from "${cmdPath}" to "${binPath}"...`)
  if (process.platform === 'win32') {
    await cmdShim(
      binPath,
      // remove the .cmd part if present, since it will get added by cmdShim
      cmdPath.endsWith('.cmd') ? cmdPath.replace(/\.cmd$/, '') : cmdPath
    )
  } else {
    fs.symlinkSync(binPath, cmdPath)
  }
}
