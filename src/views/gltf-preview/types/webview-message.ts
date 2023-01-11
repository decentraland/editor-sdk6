export enum GLFTPreviewWebviewMessageType {
  READY = 'ready',
}

export declare type GLFTPreviewWebviewMessagePayload = {
  [GLFTPreviewWebviewMessageType.READY]: {}
}

export declare type GLFTPreviewWebviewMessage<
  T extends GLFTPreviewWebviewMessageType
> = {
  type: T
  payload: GLFTPreviewWebviewMessagePayload[T]
}
