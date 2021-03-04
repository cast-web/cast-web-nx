interface CastMessageBase {
  sourceId: string; // client / channel / server
  destinationId: string // client / channel / server;
  namespace: string // client / channel / server;
}

interface CastMessagePayload {
  payloadType: 0 | 1;
  payloadBinary?: any;
  payloadUtf8?: any;
}

interface CastMessageProtocolVersion {
  protocolVersion: 0;
}

export interface CastMessageClientId {
  clientId: string; // server
}

export type CastMessageClient = CastMessageBase & CastMessageProtocolVersion & CastMessagePayload;
export type CastMessageServer = CastMessageClientId & CastMessageClient;
export type CastMessageBaseClient = CastMessageBase;
export type CastMessageBaseServer = CastMessageClientId & CastMessageBaseClient;
