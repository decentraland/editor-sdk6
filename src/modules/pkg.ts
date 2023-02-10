import fs from 'fs'
import path from 'path'
import { getExtensionPath } from './path'
import { getCwd } from './workspace'

/**
 * Return the package json of a given module
 * @param moduleName The name of the module
 * @returns The package json object
 */
export function getPackageJson(
  moduleName?: string | null,
  workspace = false
): {
  version: string
  engines: {
    node: string
  }
  bin?: { [command: string]: string }
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
} {
  const basePath = workspace ? getCwd() : getExtensionPath()
  const packageJsonPath = !!moduleName
    ? path.join(basePath, './node_modules', moduleName, 'package.json')
    : path.join(basePath, 'package.json')
  try {
    return JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
  } catch (error: any) {
    throw new Error(
      `Could not get package.json for module "${moduleName}": ${error.message}`
    )
  }
}

/**
 * Returns the version of a given module if exists, otherwise returns null
 */

export function getPackageVersion(moduleName?: string, workspace = false) {
  try {
    const pkg = getPackageJson(moduleName, workspace)
    return pkg.version
  } catch (error) {
    return null
  }
}

/**
 * Returns whether or not there's a dependency on a module
 */
export function hasDependency(moduleName: string, workspace = false) {
  const pkg = getPackageJson(undefined, workspace)
  const isDependency = !!pkg.dependencies && moduleName in pkg.dependencies
  const isDevDependency =
    !!pkg.devDependencies && moduleName in pkg.devDependencies
  return isDependency || isDevDependency
}
