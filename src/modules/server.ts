export abstract class Server {
  abstract init?(): Promise<void>
  abstract start(): Promise<void>
  abstract stop(): Promise<void>
}

