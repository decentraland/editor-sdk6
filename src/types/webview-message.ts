export enum WebviewMessageType {
  READY = 'ready',
}

export declare type WebviewMessagePayload = {
  [WebviewMessageType.READY]: {}
}

export declare type WebviewMessage<T extends WebviewMessageType> = {
  type: T
  payload: WebviewMessagePayload[T]
}
