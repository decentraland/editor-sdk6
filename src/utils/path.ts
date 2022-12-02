import * as vscode from 'vscode'
import path from 'path'
import fs from 'fs'
import { Scene } from '@dcl/schemas'
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
      : `Global storage has been set to "${path}"`
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
 * Returns the path to the workspace's current working directory
 * @returns The path to the workspace's current working directory
 */
export function getCwd() {
  const { workspaceFolders } = vscode.workspace
  if (workspaceFolders && workspaceFolders.length > 0) {
    const folder = workspaceFolders[0]
    return folder.uri.fsPath
  }
  throw new Error('getCwd(): Could not get workspace folder')
}

/**
 * Get scene json
 */
export function getScene() {
  const sceneJsonPath = path.join(getCwd(), 'scene.json')
  const scene = fs.readFileSync(sceneJsonPath, 'utf8')
  return JSON.parse(scene) as Scene
}

/**
 * Returns whether or not the workspace's current working directory is a decentraland project or not
 */
export function isDCL() {
  try {
    getScene()
    return true
  } catch (error) {
    return false
  }
}

/**
 * Returns whether or not the workspace's current working directory is empty or not
 */
export function isEmpty() {
  try {
    const files = fs.readdirSync(getCwd())
    return files.length === 0
  } catch (error) {
    return false
  }
}

/**
 * Return whether or not the workspace's current working directory has a node_modules directory
 */
export function hasNodeModules() {
  try {
    const nodeModulesPath = path.join(getCwd(), 'node_modules')
    if (fs.existsSync(nodeModulesPath)) {
      return true
    } else {
      return false
    }
  } catch (error) {
    return false
  }
}

/**
 * Helper to get the absolute path to the directory where the extension stores binaries
 * @returns The path to the node bin
 */
export function getGlobalBinPath() {
  return `${getGlobalStoragePath()}/bin`
}

/**
 * Helper to get the absolute path to the installed node binaries
 * @returns The path to the node bin
 */
export function getNodeBinPath() {
  const distribution = getDistribution()
  const globalBinPath = getGlobalBinPath()
  const pathToBin = isWindows(distribution) ? `node.exe` : `bin/node`
  return `${globalBinPath}/${distribution}/${pathToBin}`
}

/**
 * Helper to get the absolute path to the node binaries installed
 * @returns The path to the node bin
 */
export function getNodeCmdPath() {
  const cmd = process.platform === 'win32' ? `node.cmd` : `node`
  return `${getGlobalStoragePath()}/${cmd}`
}

/**
 * Replace white spaces with "\ "
 * @param p path to fix
 * @returns fixed path
 */
export function escapeWhiteSpaces(p: string) {
  return p.replace(/\s/g, '\\ ')
}

/**
 * Combines different paths as a single env PATH using the right separator given the user's platform
 */

export function joinEnvPaths(...paths: (undefined | string)[]) {
  const separator = process.platform === 'win32' ? ';' : ':'
  return paths.filter((path): path is string => !!path).join(separator)
}
