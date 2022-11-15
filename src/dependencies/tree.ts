import * as vscode from 'vscode'
import * as fs from 'fs'
import * as path from 'path'
import { Dependency } from './types'
import { getCwd } from '../utils/path'

// Dependency tree (UI)
let dependencies: DependenciesProvider | null = null

class DependenciesProvider
  implements vscode.TreeDataProvider<Dependency>
{
  constructor(private workspaceRoot: string) { }

  getTreeItem(element: Dependency): vscode.TreeItem {
    return element
  }

  getChildren(element?: Dependency): Thenable<Dependency[]> {
    if (!this.workspaceRoot) {
      vscode.window.showInformationMessage('No dependency in empty workspace')
      return Promise.resolve([])
    }

    if (element) {
      return Promise.resolve(
        this.getDepsInPackageJson(
          path.join(
            this.workspaceRoot,
            'node_modules',
            element.label,
            'package.json'
          )
        )
      )
    } else {
      const packageJsonPath = path.join(this.workspaceRoot, 'package.json')
      if (this.pathExists(packageJsonPath)) {
        return Promise.resolve(this.getDepsInPackageJson(packageJsonPath))
      } else {
        vscode.window.showWarningMessage('Workspace has no package.json')
        return Promise.resolve([])
      }
    }
  }

  /**
   * Given the path to package.json, read all its dependencies and devDependencies.
   */
  private getDepsInPackageJson(packageJsonPath: string): Dependency[] {
    if (this.pathExists(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))

      const toDep = (moduleName: string, version: string): Dependency => {
        const modulePackageJsonPath = path.join(
          this.workspaceRoot,
          'node_modules',
          moduleName,
          'package.json'
        )
        if (this.pathExists(modulePackageJsonPath)) {
          try {
            const pkg = JSON.parse(
              fs.readFileSync(modulePackageJsonPath, 'utf-8')
            )
            version = pkg.version
          } catch (error) { }
        }
        return new Dependency(
          moduleName,
          version,
          vscode.TreeItemCollapsibleState.None
        )
      }

      const deps = packageJson.dependencies
        ? Object.keys(packageJson.dependencies).map((dep) =>
          toDep(dep, packageJson.dependencies[dep])
        )
        : []
      const devDeps = packageJson.devDependencies
        ? Object.keys(packageJson.devDependencies).map((dep) =>
          toDep(dep, packageJson.devDependencies[dep])
        )
        : []
      return deps.concat(devDeps)
    } else {
      return []
    }
  }

  private pathExists(p: string): boolean {
    try {
      fs.accessSync(p)
    } catch (err) {
      return false
    }
    return true
  }

  private _onDidChangeTreeData: vscode.EventEmitter<
    Dependency | undefined | null | void
  > = new vscode.EventEmitter<Dependency | undefined | null | void>()
  readonly onDidChangeTreeData: vscode.Event<
    Dependency | undefined | null | void
  > = this._onDidChangeTreeData.event

  refresh(): void {
    this._onDidChangeTreeData.fire()
  }
}

export function createTree() {
  try {
    dependencies = new DependenciesProvider(getCwd())
  } catch (error) {
    // This will fail if the workbench is in empty state, we just ignore it
  }
}

export function refreshTree() {
  dependencies?.refresh()
}

export function registerTree() {
  return dependencies ? vscode.window.registerTreeDataProvider('dependencies', dependencies) : null
}