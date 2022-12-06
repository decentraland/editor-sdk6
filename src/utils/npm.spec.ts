import { ProgressLocation } from 'vscode'
import { SpanwedChild } from './spawn'

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
import { npmInstall } from './npm'
jest.mock('./analytics')
const trackMock = track as jest.MockedFunction<typeof track>

let child: SpanwedChild

describe('npm', () => {
  describe('When installing a dependency', () => {
    beforeEach(() => {
      child = {
        wait: jest.fn().mockResolvedValueOnce(void 0),
      } as unknown as SpanwedChild
      stopServerMock.mockResolvedValueOnce()
      binMock.mockReturnValueOnce(child)
      restartMock.mockResolvedValueOnce()
    })
    afterEach(() => {
      stopServerMock.mockReset()
      binMock.mockReset()
      restartMock.mockReset()
    })
    describe('and the install succeeds', () => {
      beforeEach(() => {
        loaderMock.mockImplementationOnce(
          (_title, waitFor) => waitFor({} as any) as Promise<void>
        )
      })
      afterEach(() => {
        loaderMock.mockReset()
      })
      it('should stop the server', async () => {
        await npmInstall('dependency')
        expect(stopServerMock).toHaveBeenCalled()
      })
      it('should install the dependency using npm', async () => {
        await npmInstall('dependency')
        expect(binMock).toHaveBeenCalledWith('npm', 'npm', [
          'install',
          'dependency',
        ])
      })
      it('should wait for the npm child process to finish', async () => {
        await npmInstall('dependency')
        expect(child.wait).toHaveBeenCalled()
      })
      it('should restart the preview', async () => {
        await npmInstall('dependency')
        expect(restartMock).toHaveBeenCalled()
      })
      it('should show a loader in the status bar', async () => {
        await npmInstall('dependency')
        expect(loaderMock).toHaveBeenCalledWith(
          'Installing dependency...',
          expect.any(Function),
          ProgressLocation.Window
        )
      })
    })
  })
})
