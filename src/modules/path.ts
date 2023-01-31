import path from 'path'
import fs from 'fs'
import { getDistribution, isWindows } from './node'
import { getPackageJson } from './pkg'
import { log } from './log'

// Stores path to the extension's directory in the filesystem
let extensionPath: string | null = null

// Stores path to the extension's global storage in the filesystem
let globalStoragePath: string | null = null

/**
 * Set the path to the extension's directory in the filesystem
 * @param path Path to the extension
 */
export function setExtensionPath(path: string | null) {
  log(
    path == null
      ? 'Extension path has been unset'
      : `Extension path has been set to "${path}"`
  )
  extensionPath = path
}

/**
 * Returns the path to the extension in the filesystem
 * @returns Path to the extension
 */
export function getExtensionPath() {
  if (extensionPath == null) {
    throw new Error(
      'Extension path has not been set, probably because the extension has not been activated yet.'
    )
  }
  return extensionPath
}

/**
 * Set the path to the extension's directory in the filesystem
 * @param path Path to the extension
 */
export function setGlobalStoragePath(path: string | null) {
  log(
    path == null
      ? 'Global storage path has been unset'
      : `Global storage path has been set to "${path}"`
  )
  globalStoragePath = path
}

/**
 * Returns the path to the global storage in the filesystem
 * @returns Path to the global storage
 */
export function getGlobalStoragePath() {
  if (globalStoragePath == null) {
    throw new Error(
      'Global storage path has not been set, probably because the extension has not been activated yet.'
    )
  }
  return globalStoragePath
}

/**
 * Return the path to an extension's dependency binary in the filesystem
 * @param moduleName The name of the module
 * @returns The path to the binary
 */
export function getModuleBinPath(moduleName: string, command: string) {
  const packageJson = getPackageJson(moduleName)
  if (!packageJson.bin) {
    throw new Error(`the module "${moduleName}" does not have a binary`)
  }
  const isValid = command in packageJson.bin
  if (!isValid) {
    throw new Error(
      `the module "${moduleName}" does not have a command called "${command}"`
    )
  }
  return path.join(
    getExtensionPath(),
    './node_modules',
    moduleName,
    packageJson.bin[command]
  )
}

/**
 * Helper to get the absolute path to the directory where the extension stores binaries
 * @returns The path to the node bin
 */
export function getGlobalBinPath() {
  return path.join(getGlobalStoragePath(), 'bin')
}

/**
 * Helper to get the absolute path to the installed node binaries
 * @returns The path to the node bin
 */
export function getNodeBinPath() {
  const distribution = getDistribution()
  const globalBinPath = getGlobalBinPath()
  const pathToBin = isWindows(distribution) ? [`node.exe`] : [`bin`, `node`]
  return path.join(globalBinPath, distribution, ...pathToBin)
}

/**
 * Helper to get the absolute path to the node binaries installed
 * @returns The path to the node bin
 */
export function getNodeCmdPath() {
  const cmd = process.platform === 'win32' ? `node.cmd` : `node`
  return path.join(getGlobalStoragePath(), cmd)
}

/**
 * Wrap path with double quotes to fix white spaces
 * @param p path to fix
 * @returns fixed path
 */
export function fixWhiteSpaces(p: string) {
  return `"${p}"`
}

/**
 * Combines different paths as a single env PATH using the right separator given the user's platform
 */

export function joinEnvPaths(...paths: (undefined | string)[]) {
  const separator = process.platform === 'win32' ? ';' : ':'
  return paths.filter((path): path is string => !!path).join(separator)
}

/**
 * Returns all the paths for files in a directory, and in subdirectories
 */

export function getFilePaths(folder: string) {
  const fileNames = fs.readdirSync(folder)
  const filePaths: string[] = []
  for (const fileName of fileNames) {
    const filePath = path.resolve(folder, fileName)
    const stats = fs.lstatSync(filePath)
    if (stats.isDirectory()) {
      const nestedFilePaths = getFilePaths(filePath)
      for (const nestedFilePath of nestedFilePaths) {
        filePaths.push(nestedFilePath)
      }
    } else if (stats.isFile()) {
      filePaths.push(filePath)
    }
  }
  return filePaths
}
