import { PreviewMessagePayload, PreviewMessageType } from "@dcl/schemas"

export enum GLFTPreviewInboundMessageType {
  UPDATE = 'update',
}

export enum GLFTPreviewOutboundMessageType {
  READY = 'ready',
}

export declare type GLFTPreviewInboundMessagePayload = {
  [GLFTPreviewInboundMessageType.UPDATE]: PreviewMessagePayload<PreviewMessageType.UPDATE>
}

export declare type GLFTPreviewOutboundMessagePayload = {
  [GLFTPreviewOutboundMessageType.READY]: null
}
