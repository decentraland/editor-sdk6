import fs from 'fs'
import path from 'path'
import { getExtensionPath } from './path'

/**
 * Return the package json of a given module
 * @param moduleName The name of the module
 * @returns The package json object
 */
export function getPackageJson(moduleName?: string): {
  engines: {
    node: string
  }
  bin?: { [command: string]: string }
} {
  const packageJsonPath = typeof moduleName === 'string' ? path.join(
    getExtensionPath(),
    './node_modules',
    moduleName,
    'package.json'
  ) : path.join(
    getExtensionPath(),
    'package.json'
  )
  try {
    return JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
  } catch (error: any) {
    throw new Error(
      `Could not get package.json for module "${moduleName}": ${error.message}`
    )
  }
}