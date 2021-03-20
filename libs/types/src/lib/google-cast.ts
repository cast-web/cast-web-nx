import { MediaStatus as MediaStatusCaf } from 'chromecast-caf-receiver/cast.framework.messages';

// NAMESPACES

// eslint-disable-next-line no-shadow
export enum Namespaces {
  Connection = 'urn:x-cast:com.google.cast.tp.connection',
  Heartbeat = 'urn:x-cast:com.google.cast.tp.heartbeat',
  Media = 'urn:x-cast:com.google.cast.media',
  Receiver = 'urn:x-cast:com.google.cast.receiver',
  DeviceAuth = 'urn:x-cast:com.google.cast.tp.deviceauth',
}

// MESSAGE-TYPES

export type ConnectionMessageTypes =
  'CONNECT' |
  'CLOSE';

export type HeartbeatMessageTypes =
  'PING' |
  'PONG';

export type MediaMessageTypes =
  'STOP' |
  'PLAY' |
  'PAUSE' |
  'SEEK';

export type ReceiverMessageTypes =
  'GET_APP_AVAILABILITY' |
  'GET_STATUS' |
  'LAUNCH' |
  'SET_VOLUME';

export type DefaultMediaReceiverMessageTypes = 'LOAD';

// STATUS-TYPES

export interface BaseStatus {
  'requestId': number,
}

export interface MediaStatus extends BaseStatus, MediaStatusCaf {
  // https://developers.google.com/cast/docs/reference/web_receiver/cast.framework.messages.MediaStatus
}

export interface ReceiverStatusApplication {
  'appId': string,
  'displayName': string,
  'namespaces': Namespaces[],
  'sessionId': string,
  'statusText': string,
  'transportId': string,
}

export interface ReceiverStatus extends BaseStatus {
  'type': 'RECEIVER_STATUS',
  'status': {
    'applications': ReceiverStatusApplication[],
    'isActiveInput': boolean,
    'volume': MediaStatus['volume'],
  },
}

// CAST-MESSAGES

interface CastMessageBase {
  sourceId: string; // client / channel / server
  /** either receiver-0 or mediaSessionId */
  destinationId: string;
  namespace: Namespaces;
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

// MESSAGE-TYPES / DATA-TYPES

export interface ConnectionMessage {
  'type': ConnectionMessageTypes,
}

export interface HeartbeatMessage {
  'type': HeartbeatMessageTypes,
}

export interface MediaData extends BaseStatus {
  'type': MediaMessageTypes,
  sessionId: string,
  // seek
  currentTime?: number,
}

// TODO: check if this is the only message type on this channel
export type MediaMessage = MediaStatus;

export interface ReceiverData extends BaseStatus {
  'type': ReceiverMessageTypes,
  appId?: string,
  volume?: MediaStatus['volume'],
}

// TODO: check if this is the only message type on this channel
export type ReceiverMessage = ReceiverStatus;

export interface DefaultMediaReceiverMessage {
  'type': DefaultMediaReceiverMessageTypes,
  // TODO: this has more of the dmr playback types
  autoplay: boolean,
}

// EXPORT

export type CastMessageClient = CastMessageBase & CastMessageProtocolVersion & CastMessagePayload;
export type CastMessageServer = CastMessageClientId & CastMessageClient;
export type CastMessageBaseClient = CastMessageBase;
export type CastMessageBaseServer = CastMessageClientId & CastMessageBaseClient;

export type CastMessages = ReceiverMessage | MediaMessage | DefaultMediaReceiverMessage;

export interface ConnectionChannel {
  namespace: Namespaces.Connection,
  data: ConnectionMessage,
  message: ConnectionMessage,
}

export interface HeartbeatChannel {
  namespace: Namespaces.Heartbeat,
  data: HeartbeatMessage,
  message: HeartbeatMessage,
}

export interface MediaChannel {
  namespace: Namespaces.Media,
  data: MediaData,
  message: MediaMessage,
}

export interface ReceiverChannel {
  namespace: Namespaces.Receiver,
  data: ReceiverData,
  message: ReceiverMessage,
}

export type BaseChannel = ConnectionChannel | HeartbeatChannel | MediaChannel | ReceiverChannel;
