import { loader } from '../utils/loader'
import { run } from '../utils/run'

export async function install(dependencies: string[] = []) {
  return loader(() => run('npm', ['install', ...dependencies]))
}
