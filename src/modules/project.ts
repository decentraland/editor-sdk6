import { repos } from 'decentraland/dist/commands/init/repositories'

export enum SdkVersion {
  SDK6 = 'sdk6',
  SDK7 = 'sdk7',
}

export function getSdkOptions() {
  return [
    {
      version: SdkVersion.SDK6,
      name: 'SDK6',
    },
    {
      version: SdkVersion.SDK7,
      name: 'SDK7 (Beta)',
    },
  ]
}

export enum ProjectType {
  SCENE = 'scene',
  LIBRARY = 'library',
  PORTABLE_EXPERIENCE = 'portableExperience',
  SMART_ITEM = 'smartItem',
}

export function getProjectTypeOptions() {
  const options: { type: ProjectType; name: string }[] = [
    {
      type: ProjectType.SCENE,
      name: 'Scene',
    },
    {
      type: ProjectType.LIBRARY,
      name: 'Library',
    },
    {
      type: ProjectType.PORTABLE_EXPERIENCE,
      name: 'Portable Experience',
    },
    {
      type: ProjectType.SMART_ITEM,
      name: 'Smart Item',
    },
  ]

  return options
}

export function getTemplates() {
  return repos.scenes
}
