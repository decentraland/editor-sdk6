import { sleep } from './sleep'

/********************************************************
                          Tests
*********************************************************/

describe('sleep', () => {
  describe('When using the sleep helper with 100 milliseconds', () => {
    it('should wait for 100 milliseconds', async () => {
      const ms = 100
      const start = Date.now()
      await sleep(ms)
      const end = Date.now()
      expect(end - start).toBeGreaterThanOrEqual(ms)
    })
  })
})
