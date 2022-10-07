# Decentraland Editor

Decentraland Editor will be the next generation of scene creation tools.

Its main focus will be the ease of use and to reduce the amount of steps required for users of any knowledge level to start creating experiences for Decentraland.

**Before:** Nowadays using the SDK in windows requires the following steps:

1. Install windows subsystem for linux
1. Install NodeJS and NPM
1. Install the Decentraland CLI
1. Create a new folder
1. Run `dcl init` in a terminal using WSL
1. Running `dcl start` in that same folder
1. Debug with the browser
1. Install VSCode
1. Use VSCode to edit the scene

The flow doesn’t take into account the learning curve of getting there and does not assume the cost of installing WSL and NPM.

**After:** Decentraland Editor instead will reduce the steps to:

1. Install VSCode
1. Install Decentraland Extension in VSCode
1. Follow the steps in the UI to start a new project
1. Click on “Debug” inside the project to preview the scene and debug inside VSCode itself or chrome

The publishing flow using VSCode extensions will also help users to not worry about being up to date with latest bug fixes and it will abstract them from NPM/Node/Terminal.

## Why VSCode instead of a standalone or web app?

Extension marketplace will handle and abstract the users (and DCL) from

- Keeping the tool up to date
- Distribution channel
- Beta program
- Ease of use, not needing to install extra things to get Decentraland up and running
- All the files, projects infrastructure is already there, in the form of file system
- Local first
- For more mature studios/developers, it will integrate with their usual workflows and versioning tools
- Time to market
- Doesn’t require any server development or maintenance

## Stages of the project

- Phase 1, centered in enhancing the development experience
- Phase 2, focused on separating Art pipelines from developer pipelines
- Phase 3, creation of interactive scenes without code
