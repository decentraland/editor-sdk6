import * as vscode from 'vscode'
import fs from 'fs'
import path from 'path'
import { Scene } from '@dcl/schemas'
import { getPackageJson } from './pkg'

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
  return JSON.parse(scene) as Scene & {
    worldConfiguration?: {
      name: string
    }
  }
}

/**
 * Returns whether or not the workspace's current working directory is a decentraland project or not
 */
export function isDCL() {
  try {
    getScene()
    const pkg = getPackageJson()
    return '@dcl/sdk' in pkg.dependencies
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
