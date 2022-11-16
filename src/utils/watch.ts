import chokidar from 'chokidar'
import path from 'path'
import { refreshTree } from '../dependencies/tree'
import { debounce } from './debounce'
import { log } from './log'
import { getCwd } from './path'

let watcher: chokidar.FSWatcher | null = null

function getPath() {
  const nodeModulesPath = path.join(getCwd(), 'node_modules')
  return nodeModulesPath
}

function handleChange() {
  // refresh dependency tree
  refreshTree()
}

export function watch() {
  const nodeModulesPath = getPath()
  log(`Watching for changes on ${nodeModulesPath}`)
  unwatch()
  watcher = chokidar.watch(getPath())
  watcher.on('all', debounce(handleChange, 500))
}

export function unwatch() {
  if (watcher) {
    const nodeModulesPath = getPath()
    log(`Stopped watching for changes on ${nodeModulesPath}`)
    watcher.unwatch(nodeModulesPath)
    watcher = null
  }
}
