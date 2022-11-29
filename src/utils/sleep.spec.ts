import { sleep } from './sleep'

describe('sleep', () => {
  it('should wait for 100 milliseconds', async () => {
    const ms = 100
    const start = Date.now()
    await sleep(ms)
    const end = Date.now()
    expect(end - start).toBeGreaterThanOrEqual(ms)
  })
})
