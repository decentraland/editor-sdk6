import { run } from '../utils/run'

export async function install(dependencies: string[] = []) {
  return run('npm', ['install', ...dependencies])
}
