export enum GLTFPreviewType {
  MODEL = 'model',
  EMOTE = 'emote',
}

export enum GLFTPreviewExtensionMessageType {
  INIT = 'init',
}

export declare type GLFTPreviewExtensionMessagePayload = {
  [GLFTPreviewExtensionMessageType.INIT]: {
    file: Uint8Array
    otherFiles: { name: string, data: Uint8Array }[]
    type: GLTFPreviewType
  }
}

export declare type GLFTPreviewExtensionMessage<
  T extends GLFTPreviewExtensionMessageType
> = {
  type: T
  payload: GLFTPreviewExtensionMessagePayload[T]
}
