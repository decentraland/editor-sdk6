import * as vscode from 'vscode'
import path from 'path'
import fs from 'fs'

// Stores path to the extension's directory in the filesystem
let extensionPath: string | null = null

/**
 * Set the path to the extension's directory in the filesystem
 * @param path Path to the extension
 */
export function setExtensionPath(path: string | null) {
  console.log(
    path == null
      ? 'Extension path has been unset'
      : `Extension path has been set to "${path}".`
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
 * Return the path to an extension's dependency binary in the filesystem
 * @param moduleName The name of the module
 * @returns The path to the binary
 */
export function getLocalBinPath(moduleName: string) {
  return path.join(
    getExtensionPath(),
    './node_modules/.bin/',
    /^win/.test(process.platform) ? `${moduleName}.cmd` : moduleName
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
 * Returns whether or not the workspace's current working directory is a decentraland project or not
 */
export function isDCL() {
  try {
    const sceneJsonPath = path.join(getCwd(), 'scene.json')
    const scene = fs.readFileSync(sceneJsonPath, 'utf8')
    JSON.parse(scene)
    return true
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
