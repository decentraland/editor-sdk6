let extensionPath: string | null = null

export function setExtensionPath(path: string | null) {
  console.log(
    path == null
      ? 'Extension path has been unset'
      : `Extension path has been set to "${path}".`
  )
  extensionPath = path
}

export function getExtensionPath() {
  if (extensionPath == null) {
    throw new Error(
      'Extension path has not been set, probably because the extension has not been activated yet.'
    )
  }
  return extensionPath
}
