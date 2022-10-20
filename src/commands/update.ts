import { loader } from '../utils/loader'
import { run } from '../utils/run'

export async function update() {
  return loader('Installing dependencies', () => run('npm', ['install']))
}
