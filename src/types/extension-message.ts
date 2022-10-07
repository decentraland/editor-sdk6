export enum PreviewType {
  MODEL = 'model',
  EMOTE = 'emote',
}

export enum ExtensionMessageType {
  INIT = 'init',
}

export declare type ExtensionMessagePayload = {
  [ExtensionMessageType.INIT]: {
    file: Uint8Array
    type: PreviewType
  }
}

export declare type ExtensionMessage<T extends ExtensionMessageType> = {
  type: T
  payload: ExtensionMessagePayload[T]
}
