import { syncSdkVersion } from './sdk'

/********************************************************
                          Mocks
*********************************************************/

import { npmInstall } from './npm'
jest.mock('./npm')
const npmInstallMock = npmInstall as jest.MockedFunction<typeof npmInstall>

import { getPackageVersion } from './pkg'
jest.mock('./pkg')
const getPackageVersionMock = getPackageVersion as jest.MockedFunction<
  typeof getPackageVersion
>

/********************************************************
                          Tests
*********************************************************/

let extensionSdkVersion = '1.0.0'
let workspaceSdkVersion = '1.0.0'

describe('sdk', () => {
  beforeEach(() => {
    getPackageVersionMock.mockImplementation((_path, workspace) =>
      workspace ? workspaceSdkVersion : extensionSdkVersion
    )
  })
  afterEach(() => {
    getPackageVersionMock.mockReset()
  })
  describe('When syncing the SDK version', () => {
    describe('and the version of the workspace is the same than the one on the extension', () => {
      beforeEach(() => {
        extensionSdkVersion = '1.0.0'
        workspaceSdkVersion = extensionSdkVersion
      })
      it('should not install the sdk', async () => {
        await syncSdkVersion()
        expect(npmInstallMock).not.toHaveBeenCalled()
      })
    })
    describe('and the version of the workspace is the same than the one on the extension', () => {
      beforeEach(() => {
        extensionSdkVersion = '2.0.0'
        workspaceSdkVersion = '1.0.0'
      })
      it('should install the extension version into the workspace', async () => {
        await syncSdkVersion()
        expect(npmInstallMock).toHaveBeenCalledWith('@dcl/sdk@2.0.0')
      })
    })
  })
})
