import fs from 'fs'
import fetch from 'node-fetch';
import tar from 'tar-fs'
import gunzip from 'gunzip-maybe';
import future from 'fp-future';
import { getGlobalStoragePath, getNodeBinPath } from "./path"
import { log } from './log';

/**
 * Returns the node version that will be used to run binaries
 * @returns node version
 */
export function getVersion() {
  return process.version
}

/**
 * Returns the platform + arch needed for the binaries
 * @returns 
 */
export function getPlatform() {
  let platform = ''
  switch (process.platform) {
    case "darwin":
      platform = "darwin"
      break
    case "win32":
      platform = "win"
      break
    case "linux":
      platform = "linux"
      break
    default:
      throw new Error(`Unsupported platform: "${process.platform}"`)
  }

  platform += '-'

  switch (process.arch) {
    case "arm64":
      platform += "arm64"
      break
    case "arm":
      platform += "armv71"
      break
    case "x64":
      platform += 'x64'
      break
    case "ppc64":
      platform += 'ppc64le'
      break
    case "s390x":
      platform += "s390x"
      break
    default:
      throw new Error(`Unsupported architecture: "${process.arch}"`)
  }

  return platform
}

export function getDistribution() {
  return `node-${getVersion()}-${getPlatform()}`
}


export async function download() {
  const version = getVersion()
  const binPath = getNodeBinPath()
  const isNodeInstalled = fs.existsSync(binPath)
  if (isNodeInstalled) {
    log(`node is already installed: ${getVersion()}`)
    return
  }
  log('installing node')
  const dist = getDistribution()
  const url = `https://nodejs.org/dist/${version}/${dist}.tar.gz`
  log('dist', dist)
  const resp = await fetch(url)
  if (!resp.ok) {
    let error = `Could not download "${dist}"`
    try {
      error += `: ${await resp.text()}`
    } catch (error) {
      console.warn(`Could not parse response body as text`)
    }
    throw new Error(error)
  }
  log('response ok', resp.ok.toString())
  const save = future()
  // TODO: check if directory already exist, rimraf it if it does
  log('saving to file system:', getGlobalStoragePath())
  const stream = tar.extract(getGlobalStoragePath(), {})
  resp.body.pipe(gunzip()).pipe(stream)
  resp.body.on('end', save.resolve)
  stream.on('error', save.reject)
  await save
  log('saved!')
}