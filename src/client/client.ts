import * as tls from 'tls';
import { TLSSocket } from 'tls';
import { Channel, ChannelEncoding } from './channel';
import { PacketStream } from '../common/packet-stream';
import { CastMessage } from '../protocol/proto-buf';
import { CastMessageClient, CastMessageBaseClient } from '../protocol/google-cast';
import { TypedEmitter } from '../common/typed-emitter';
import { logger } from '../common/logger';

export interface ClientEvents {
  error: (error: Error) => void;
  // eslint-disable-next-line max-len
  message: (message: CastMessageClient) => void;
  close: () => void;
  connect: () => void;
}

export interface ClientConnectOptions {
  host: string;
  port: number;
  rejectUnauthorized: boolean;
}

export class Client extends TypedEmitter<ClientEvents> {
  // private { CastMessage } = protocol;
  // util.inherits(Client, EventEmitter);

  private socket: TLSSocket | undefined;
  private packetStream: PacketStream | undefined;

  // constructor() {
  //   super();
  //   // EventEmitter.call(this);
  // }

  public connect(options: ClientConnectOptions, callback: () => void) {
    // options.port = options.port || 8009;
    // options.rejectUnauthorized = false;

    if (callback) this.once('connect', callback);

    logger.debug('connect', options);

    this.socket = tls.connect(options, () => {
      this.packetStream = new PacketStream(this.socket);
      logger.debug('connected', options);
      this.emit('connect');
    });

    this?.packetStream?.on('packet', this.onPacketStreamPacket); // TODO: maybe move this line?
    this.socket.on('error', this.onSocketError);
    this.socket.once('close', this.onSocketClose);
  }

  private onPacketStreamPacket(buffer: any) {
    // TODO: type this in and refactor()
    const message = CastMessage.parse(buffer) as unknown as CastMessageClient;

    logger.debug('onPacketStreamPacket', message);
    if (message.protocolVersion !== 0) { // CASTV2_1_0
      this.emit('error', new Error(`Unsupported protocol version: ${message.protocolVersion}`));
      this.close();
      return;
    }

    this.emit('message', message);
  }

  private onSocketError(err: Error): void {
    logger.debug('onSocketError', err);
    this.emit('error', err);
  }

  private onSocketClose(): void {
    logger.debug('onSocketClose');
    this?.socket?.removeListener('error', this.onSocketError);
    this.socket = undefined;

    this?.packetStream?.removeListener('packet', this.onPacketStreamPacket);
    this.packetStream = undefined;
    this.emit('close');
  }

  public close() {
    logger.debug('close');
    // using socket.destroy here because socket.end caused stalled connection
    // in case of dongles going brutally down without a chance to FIN/ACK
    this?.socket?.destroy();
  }

  public send(baseCastMessage: CastMessageBaseClient, data: any) {
    const isBuffer = Buffer.isBuffer(data);
    const message: CastMessageClient = {
      ...baseCastMessage,
      protocolVersion: 0, // CASTV2_1_0
      payloadType: isBuffer ? 1 : 0,
      // TODO: does this work?
      payloadBinary: isBuffer ? data : undefined,
      payloadUtf8: isBuffer ? undefined : data,
    };

    logger.debug('send', message);

    const buffer = CastMessage.serialize(message);
    this?.packetStream?.send(buffer);
  }

  public createChannel(
    sourceId: string,
    destinationId: string,
    namespace: string,
    encoding: ChannelEncoding,
  ): Channel {
    return new Channel(this, sourceId, destinationId, namespace, encoding);
  }
}
