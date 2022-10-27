import { repos } from 'decentraland/dist/commands/init/repositories'

export enum ProjectType {
  SCENE = 'scene',
  LIBRARY = 'library',
  PORTABLE_EXPERIENCE = 'portableExperience',
  SMART_ITEM = 'smartItem',
}

export function getTypeOptions() {
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

export function getSamples() {
  return repos.scenes
}
