import { MessageItem, ProgressLocation, window } from 'vscode'
import { SpanwedChild } from './spawn'

/********************************************************
                          Mocks
*********************************************************/

import { loader } from './loader'
jest.mock('./loader')
const loaderMock = loader as jest.MockedFunction<typeof loader>

import { bin } from './bin'
jest.mock('./bin')
const binMock = bin as jest.MockedFunction<typeof bin>

import { restart } from '../commands/restart'
jest.mock('../commands/restart')
const restartMock = restart as jest.MockedFunction<typeof restart>

import { stopServer } from '../dcl-preview/server'
jest.mock('../dcl-preview/server')
const stopServerMock = stopServer as jest.MockedFunction<typeof stopServer>

import { getLocalValue, setLocalValue } from './storage'
jest.mock('./storage')
const getLocalValueMock = getLocalValue as jest.MockedFunction<
  typeof getLocalValue
>
const setLocalValueMock = setLocalValue as jest.MockedFunction<
  typeof setLocalValue
>

import { track } from './analytics'
import {
  npmInstall,
  npmUninstall,
  warnDecentralandLibrary,
  warnOutdatedDependency,
} from './npm'
jest.mock('./analytics')
const trackMock = track as jest.MockedFunction<typeof track>

const showWarningMessagesMock =
  window.showWarningMessage as jest.MockedFunction<
    typeof window.showWarningMessage
  >

const showErrorMessageMock = window.showErrorMessage as jest.MockedFunction<
  typeof window.showErrorMessage
>

let child: SpanwedChild

/********************************************************
                          Tests
*********************************************************/

describe('npm', () => {
  beforeEach(() => {
    child = {
      wait: jest.fn().mockResolvedValue(void 0),
    } as unknown as SpanwedChild
    stopServerMock.mockResolvedValue()
    binMock.mockReturnValue(child)
    restartMock.mockResolvedValue()
  })
  afterEach(() => {
    stopServerMock.mockReset()
    binMock.mockReset()
    restartMock.mockReset()
  })
  describe('When installing dependencies', () => {
    describe('and the installation succeeds', () => {
      beforeEach(() => {
        loaderMock.mockImplementationOnce(
          (_title, waitFor) => waitFor({} as any) as Promise<void>
        )
      })
      afterEach(() => {
        loaderMock.mockReset()
      })
      it('should stop the server', async () => {
        await npmInstall()
        expect(stopServerMock).toHaveBeenCalled()
      })
      it('should use npm to install the dependencies', async () => {
        await npmInstall()
        expect(binMock).toHaveBeenCalledWith('npm', 'npm', ['install'])
      })
      it('should wait for the npm child process to finish', async () => {
        await npmInstall()
        expect(child.wait).toHaveBeenCalled()
      })
      it('should restart the preview', async () => {
        await npmInstall()
        expect(restartMock).toHaveBeenCalled()
      })
      it('should show a notification', async () => {
        await npmInstall()
        expect(loaderMock).toHaveBeenCalledWith(
          'Installing dependencies...',
          expect.any(Function),
          ProgressLocation.Notification
        )
      })
      it('should track the npm.install event', async () => {
        await npmInstall()
        expect(trackMock).toHaveBeenCalledWith('npm.install', {
          dependency: null,
        })
      })
      describe('and only one dependency is being installed', () => {
        it('should pass that dependency as a parameter to npm', async () => {
          await npmInstall('the-dependency')
          expect(binMock).toHaveBeenCalledWith('npm', 'npm', [
            'install',
            'the-dependency',
          ])
        })
        it('should show a loader in the status bar', async () => {
          await npmInstall('the-dependency')
          expect(loaderMock).toHaveBeenCalledWith(
            'Installing the-dependency...',
            expect.any(Function),
            ProgressLocation.Window
          )
        })
        describe('and the dependency is a decentraland library', () => {
          it('should bundle the dependency', async () => {
            await npmInstall('dcl-library', true)
            expect(binMock).toHaveBeenCalledWith('npm', 'npm', [
              'install --save-bundle',
              'dcl-library',
            ])
          })
        })
      })
    })
    describe('and the installation fails', () => {
      beforeEach(() => {
        loaderMock.mockRejectedValueOnce(new Error('Some error'))
      })
      afterEach(() => {
        loaderMock.mockReset()
      })
      it('should throw an error', async () => {
        await expect(npmInstall()).rejects.toThrow('Some error')
      })
    })
  })
  describe('When uninstalling a dependency', () => {
    describe('and the uninstallation succeeds', () => {
      beforeEach(() => {
        loaderMock.mockImplementationOnce(
          (_title, waitFor) => waitFor({} as any) as Promise<void>
        )
      })
      afterEach(() => {
        loaderMock.mockReset()
      })
      it('should stop the server', async () => {
        await npmUninstall('the-dependency')
        expect(stopServerMock).toHaveBeenCalled()
      })
      it('should use npm to uninstall the dependencies', async () => {
        await npmUninstall('the-dependency')
        expect(binMock).toHaveBeenCalledWith('npm', 'npm', [
          'uninstall',
          'the-dependency',
        ])
      })
      it('should wait for the npm child process to finish', async () => {
        await npmUninstall('the-dependency')
        expect(child.wait).toHaveBeenCalled()
      })
      it('should restart the preview', async () => {
        await npmUninstall('the-dependency')
        expect(restartMock).toHaveBeenCalled()
      })
      it('should show a loader in the status bar', async () => {
        await npmUninstall('the-dependency')
        expect(loaderMock).toHaveBeenCalledWith(
          'Uninstalling the-dependency...',
          expect.any(Function)
        )
      })
      it('should track the npm.uninstall event', async () => {
        await npmUninstall('the-dependency')
        expect(trackMock).toHaveBeenCalledWith('npm.uninstall', {
          dependency: 'the-dependency',
        })
      })
    })
    describe('and the uninstallation fails', () => {
      beforeEach(() => {
        loaderMock.mockRejectedValueOnce(new Error('Some error'))
      })
      afterEach(() => {
        loaderMock.mockReset()
      })
      it('should throw an error', async () => {
        await expect(npmUninstall('the-dependency')).rejects.toThrow(
          'Some error'
        )
      })
    })
  })
  describe('When warning that a dependency is outdated', () => {
    beforeEach(() => {
      loaderMock.mockImplementationOnce(
        (_title, waitFor) => waitFor({} as any) as Promise<void>
      )
    })
    afterEach(() => {
      loaderMock.mockReset()
    })
    describe('and the messagge has been ignored', () => {
      beforeEach(() => {
        getLocalValueMock.mockReturnValueOnce(true)
      })
      afterEach(() => {
        getLocalValueMock.mockReset()
      })
      it('should not promp the user', async () => {
        await warnOutdatedDependency('the-dependency')
        expect(showWarningMessagesMock).not.toHaveBeenCalled()
      })
    })
    describe('and the messagge has not been ignored', () => {
      beforeEach(() => {
        getLocalValueMock.mockReturnValueOnce(false)
      })
      afterEach(() => {
        getLocalValueMock.mockReset()
      })
      describe('and the user selects to update the dependency', () => {
        beforeEach(() => {
          showWarningMessagesMock.mockResolvedValueOnce(
            'Update' as unknown as MessageItem
          )
          loaderMock.mockResolvedValueOnce(void 0)
        })
        afterEach(() => {
          showWarningMessagesMock.mockReset()
          loaderMock.mockReset()
        })
        it('should track the show event', async () => {
          await warnOutdatedDependency('the-dependency')
          expect(trackMock).toHaveBeenCalledWith(
            'npm.warn_outdated_dependency:show'
          )
        })
        it('should promp the user', async () => {
          await warnOutdatedDependency('the-dependency')
          expect(showWarningMessagesMock).toHaveBeenCalledWith(
            'The dependency "the-dependency" is outdated',
            'Update',
            'Ignore'
          )
        })
        it('should install the latest version of the dependency using npm', async () => {
          await warnOutdatedDependency('the-dependency')
          expect(binMock).toHaveBeenCalledWith('npm', 'npm', [
            'install',
            'the-dependency@latest',
          ])
        })
        it('track the update event', async () => {
          await warnOutdatedDependency('the-dependency')
          expect(trackMock).toHaveBeenCalledWith(
            'npm.warn_outdated_dependency:update'
          )
        })
      })
      describe('and the user ignores the warning', () => {
        beforeEach(() => {
          showWarningMessagesMock.mockResolvedValueOnce(
            'Ignore' as unknown as MessageItem
          )
          setLocalValueMock.mockReturnValueOnce(void 0)
        })
        afterEach(() => {
          showWarningMessagesMock.mockReset()
          setLocalValueMock.mockReset()
        })
        it('should store the ignore flag in the local storage', async () => {
          await warnOutdatedDependency('the-dependency')
          expect(setLocalValueMock).toHaveBeenCalledWith(
            'ignore:the-dependency',
            true
          )
        })
        it('should track the ignore event', async () => {
          await warnOutdatedDependency('the-dependency')
          expect(trackMock).toHaveBeenCalledWith(
            'npm.warn_outdated_dependency:ignore'
          )
        })
      })
    })
  })
  describe('When warning a dependency is not a decentraland library', () => {
    beforeEach(() => {
      loaderMock.mockImplementation(
        (_title, waitFor) => waitFor({} as any) as Promise<void>
      )
    })
    afterEach(() => {
      loaderMock.mockReset()
    })
    describe('and the user selects to re-install the dependency', () => {
      beforeEach(() => {
        showErrorMessageMock.mockResolvedValueOnce(
          'Re-install' as unknown as MessageItem
        )
      })
      afterEach(() => {
        showErrorMessageMock.mockReset()
      })
      it('should track the show event', async () => {
        await warnDecentralandLibrary('the-dependency')
        expect(trackMock).toHaveBeenCalledWith(
          'npm.warn_decentraland_library:show'
        )
      })
      it('should promp the user', async () => {
        await warnDecentralandLibrary('the-dependency')
        expect(showErrorMessageMock).toHaveBeenCalledWith(
          'The dependency "the-dependency" is not a valid Decentraland library. You can re-install it as non-library, or remove it.',
          'Re-install',
          'Remove'
        )
      })
      it('should re-install the dependency using npm', async () => {
        await warnDecentralandLibrary('the-dependency')
        expect(binMock).toHaveBeenCalledTimes(2)
        expect(binMock).toHaveBeenCalledWith('npm', 'npm', [
          'uninstall',
          'the-dependency',
        ])
        expect(binMock).toHaveBeenCalledWith('npm', 'npm', [
          'install',
          'the-dependency',
        ])
      })
      it('track the update event', async () => {
        await warnDecentralandLibrary('the-dependency')
        expect(trackMock).toHaveBeenCalledWith(
          'npm.warn_decentraland_library:reinstall'
        )
      })
    })
    describe('and the user removes the dependency', () => {
      beforeEach(() => {
        showErrorMessageMock.mockResolvedValueOnce(
          'Remove' as unknown as MessageItem
        )
      })
      afterEach(() => {
        showErrorMessageMock.mockReset()
        binMock.mockReset()
      })
      it('should uninstall the dependency using npm', async () => {
        await warnDecentralandLibrary('the-dependency')
        expect(binMock).toHaveBeenCalledWith('npm', 'npm', [
          'uninstall',
          'the-dependency',
        ])
      })
      it('should track the ignore event', async () => {
        await warnDecentralandLibrary('the-dependency')
        expect(trackMock).toHaveBeenCalledWith(
          'npm.warn_decentraland_library:remove'
        )
      })
    })
  })
})
