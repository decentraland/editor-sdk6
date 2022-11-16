
declare module 'node-fetch-progress' {
  import { Response } from 'node-fetch'
  type ProgressData = {
    total: number,
    done: number,
    totalh: number,
    doneh: number,
    startedAt: number,
    elapsed: number,
    rate: number,
    rateh: number,
    estimated: number,
    progress: number,
    eta: number,
    etah: number,
    etaDat: number,
  }
  class Progress {
    constructor(response: Response)
    on(eventName: 'progress', callback: (progress: ProgressData) => void): void
  }
  export default Progress
}