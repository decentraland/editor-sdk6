import { ProgressLocation, window } from 'vscode'
import { loader } from './loader'

/********************************************************
                          Mocks
*********************************************************/

let waitFor: jest.MockedFunction<() => Promise<void>>
let loaderPromise: Promise<void>

const withProgressMock = window.withProgress as jest.MockedFunction<
  typeof window.withProgress
>

import { sleep } from './sleep'
jest.mock('./sleep')
const sleepMock = sleep as jest.MockedFunction<typeof sleep>

/********************************************************
                          Tests
*********************************************************/

describe('loader', () => {
  describe('When creating a loader', () => {
    beforeEach(() => {
      waitFor = jest.fn().mockResolvedValue(void 0)
      loaderPromise = loader(
        'Some loader',
        waitFor,
        ProgressLocation.Notification,
        true
      )
    })
    afterEach(() => {
      waitFor.mockReset()
      sleepMock.mockReset()
    })
    it('should use the provided title', () => {
      expect(withProgressMock).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Some loader',
        }),
        expect.any(Function)
      )
    })
    it('should use the provided location', () => {
      expect(withProgressMock).toHaveBeenCalledWith(
        expect.objectContaining({
          location: ProgressLocation.Notification,
        }),
        expect.any(Function)
      )
    })
    it('should use the provided cancellable', () => {
      expect(withProgressMock).toHaveBeenCalledWith(
        expect.objectContaining({
          cancellable: true,
        }),
        expect.any(Function)
      )
    })
    it('should call the waitFor function', () => {
      expect(waitFor).toHaveBeenCalled()
    })
    it('should resolve the loader promise when the waitFor resolves', async () => {
      await expect(loaderPromise).resolves.toBe(void 0)
    })
    it('should animate the progress bar by looping and sleeping', async () => {
      expect(sleepMock).toBeCalledTimes(13)
    })
    describe('and the waitFor rejects', () => {
      beforeEach(() => {
        loaderPromise = loader(
          'Some loader',
          jest.fn().mockRejectedValue(new Error('Some error'))
        )
      })
      it('should reject the loader promise', async () => {
        await expect(loaderPromise).rejects.toThrow('Some error')
      })
    })
  })
})
