import { sleep } from './sleep'

/********************************************************
                          Tests
*********************************************************/

describe('sleep', () => {
  describe('When using the sleep helper with 100 milliseconds', () => {
    beforeAll(() => {
      jest.useFakeTimers()
    })
    afterAll(() => {
      jest.useRealTimers()
    })
    it('should resolve the promise after the time has passed', async () => {
      const promise = sleep(100)
      jest.advanceTimersByTime(100)
      await expect(promise).resolves.toBe(void 0)
    })
  })
})
