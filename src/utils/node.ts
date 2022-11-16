import fs from 'fs'
import path from 'path';
import semver from 'semver'
import rimraf from 'rimraf'
import fetch from 'node-fetch';
import Progress from 'node-fetch-progress';
import tar from 'tar-fs'
import gunzip from 'gunzip-maybe';
import future from 'fp-future';
import { getGlobalBinPath, getNodeBinPath } from './path'
import { log } from './log';
import { getPackageJson } from './pkg';
import { sleep } from './sleep';

/**
 * Returns the node version that will be used to run binaries
 * @returns node version
 */
let version: string | null
export function getVersion() {
  if (version === null) {
    throw new Error(`Node version not set`)
  }
  return version
}

export function setVersion(_version: string) {
  version = _version
}

/**
 * Fetches the latest supported node version
 */
export async function resolveVersion() {
  const pkg = getPackageJson()
  const min = semver.minVersion(pkg.engines.node)
  if (!min) {
    throw new Error(`Could not resolve minimum node version. The value found in the package.json for engines.node is "${pkg.engines.node}".`)
  }
  log(`Node engine required: ${pkg.engines.node}`)

  const installed = await getLatestFromInstalled(min.major)
  if (installed) {
    log(`Latest node version installed: ${installed}`)
  }

  const latest = await getLatestFromGithub(min.major)
  if (latest) {
    log(`Latest node version available: ${latest}`)
  }

  const version = latest || installed || min.version
  log(`Using node version: v${version}`)
  return version
}


/**
 * Extracts the version from the distribution
 * @param distribution 
 * @returns 
 */
function extractVersion(distribution: string) {
  return distribution.split('node-v').pop()?.split('-')[0]!
}

/**
 * Get the latest version of node installed
 * @returns 
 */
async function getLatestFromInstalled(major: number) {
  const distributions = await getInstalledDistributions()
  return distributions
    .map(extractVersion)
    .reduce<string | null>((latest, version) => !latest || (semver.gt(version, latest) && semver.satisfies(version, `^${major}.0.0`)) ? version : latest, null)
}

/**
 * Get the list of installed distributions
 * @returns 
 */
async function getInstalledDistributions() {
  const versions = future<string[]>()
  fs.readdir(getGlobalBinPath(), (error, result) => error ? versions.resolve([]) : versions.resolve(result))
  return versions
}

/**
 * Returns the latest version for a given major, fetching data from GitHub
 * @param major 
 * @param page 
 * @returns 
 */
async function getLatestFromGithub(major: number, page = 1): Promise<string | null> {
  try {
    const versions = await getAvailableVersions(page)

    let latest: string | null = null
    for (const version of versions) {
      const inRange = semver.satisfies(version, `^${major}.0.0`)
      const isNewer = !latest || semver.gt(version, latest)
      if (inRange && isNewer) {
        latest = version
      }
    }

    // if no version found in this page, look in the next one
    if (latest === null) {
      return getLatestFromGithub(major, page + 1)
    }

    // if the latest version was found in this page, we use that one
    return latest
  } catch (error: any) {
    log(`Could not look for newer versions...`)
    return null
  }
}

/**
 * Returns available Node versions using the GitHub API to fetch releases
 * @param page 
 * @returns 
 */
async function getAvailableVersions(page: number) {
  const resp = await fetch(`https://api.github.com/repos/nodejs/node/tags?per_page=10&page=${page}`)
  if (!resp.ok) {
    throw new Error(`Error fetching available node versions: ${await resp.text()}`)
  }
  const tags: { name: string }[] = await resp.json()
  return tags.map(({ name }) => semver.clean(name)!)
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
  return `node-v${getVersion()}-${getPlatform()}`
}

/**
 * Installs a given distribution
 * @param distribution 
 */
async function install(distribution: string) {
  const binPath = getGlobalBinPath()
  log(`Distribution: ${distribution}`)
  log(`Path: ${binPath}`)
  const url = `https://nodejs.org/dist/v${extractVersion(distribution)}/${distribution}.tar.gz`
  const resp = await fetch(url)
  if (!resp.ok) {
    let error = `Could not download "${distribution}"`
    try {
      error += `: ${await resp.text()}`
    } catch (error) {
      console.warn(`Could not parse response body as text`)
    }
    log(error)
    throw new Error(error)
  }
  const progress = new Progress(resp)
  let lastPercentage = 0
  progress.on('progress', data => {
    const percentage = (data.done / data.total * 100)
    // Report progress every 5% or more
    if (!lastPercentage || percentage > lastPercentage + 5) {
      const line = `Installing... ${percentage.toFixed(0)}%`
      log(line)
      lastPercentage = percentage
    }
  })
  const save = future()
  const stream = tar.extract(binPath)
  resp.body.pipe(gunzip()).pipe(stream)
  resp.body.on('end', save.resolve)
  stream.on('error', save.reject)
  await save
  log('Installing... 100%')
  await sleep(1000)
  log('Done!')
}

/**
 * Uninstalls a given distribution
 * @param distribution 
 */
async function uninstall(distribution: string) {
  log(`Uninstalling ${distribution}...`)
  const directory = path.join(getGlobalBinPath(), distribution)
  const clear = future<void>()
  rimraf(directory, error => error ? clear.reject(error) : clear.resolve())
  await clear
  log(`Done!`)
}

/**
 * This checks if the necessary binaries are installed. If not, it proceeds to uninstall older distributions and install the expected one.
 * @returns 
 */
export async function checkBinaries() {
  const nodeBinPath = getNodeBinPath()
  const isNodeInstalled = fs.existsSync(nodeBinPath)
  if (!isNodeInstalled) {
    log(`The required node binaries are not installed`)

    // Check if global /bin dir exists, if not, creates it
    const globalBinPath = getGlobalBinPath()
    const hasBinDir = fs.existsSync(globalBinPath)
    if (!hasBinDir) {
      fs.mkdirSync(globalBinPath, { recursive: true })
    }

    // Uninstall older distributions
    const distributions = await getInstalledDistributions()
    for (const distribution of distributions) {
      await uninstall(distribution)
    }

    // Install the current distribution
    const distribution = getDistribution()
    await install(distribution)
  }
}