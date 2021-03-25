import * as tls from 'tls';
import { TLSSocket } from 'tls';
import { once } from 'events';
import { Channel, ChannelEncoding } from './channel';
import { PacketStream } from '../common/packet-stream';
import { CastMessage } from '../protocol/proto-buf';
import {
  CastMessageClient,
  CastMessageBaseClient,
  CastMessages,
  ConnectionChannel, HeartbeatChannel, MediaChannel, ReceiverChannel,
} from '@cast-web/types';
import { TypedEmitter } from '../common/typed-emitter';
import { logger } from '../common/logger';

export interface ClientEvents {
  error: (error: Error) => void;
  message: (message: CastMessageClient) => void;
  close: () => void;
  connect: () => void;
}

export interface ClientConnectOptions {
  host: string;
  port?: number;
  rejectUnauthorized?: boolean;
}

/**
 * Manages socket connections and messages
 * @example
 * ``` ts
 * import { Client } from '@cast-web/protocol';
 *
 * const client = new Client();
 * // wait for the client to connect
 * await client.connect({ host: '192.168.1.101' });
 *
 * client.on('connect', () => console.log('client connect'));
 * client.on('close', () => console.log('client close'));
 * client.on('error', error => console.log('client error:', error));
 * client.on('message', message => console.log('client message:', message));
 *
 * // create channels here
 * ```
 */
export class Client extends TypedEmitter<ClientEvents> {
  private socket: TLSSocket | undefined;
  private packetStream: PacketStream | undefined;

  /**
   * Connects to the client.
   * @param options
   * @returns Promise<void> - indicating connection established
   */
  public async connect(options: ClientConnectOptions): Promise<void> {
    const clientConnectOptions: ClientConnectOptions = {
      ...options,
      port: options?.port || 8009,
      rejectUnauthorized: options?.rejectUnauthorized || false,
    };

    logger.info('connecting', options);

    this.socket = tls.connect(clientConnectOptions, () => {
      this.packetStream = new PacketStream(this.socket as TLSSocket);
      this.packetStream?.on('packet', buf => this.onPacketStreamPacket(buf)); // TODO: maybe move this line?
      logger.info('connected', clientConnectOptions);
      this.emit('connect');
    });

    this.socket.on('error', (err: Error) => this.onSocketError(err));
    this.socket.once('close', () => this.onSocketClose());

    return once(this, 'connect') as unknown as Promise<void>;
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
    logger.error('onSocketError', err);
    this.emit('error', err);
  }

  private onSocketClose(): void {
    logger.info('onSocketClose');
    this?.socket?.removeListener('error', this.onSocketError);
    this.socket = undefined;

    this?.packetStream?.removeListener('packet', this.onPacketStreamPacket);
    this.packetStream = undefined;
    this.emit('close');
  }

  /**
   * Closes the client connection
   * @remarks Important to prevent EventEmitter leaks.
   */
  public close(): void {
    logger.info('close');
    // using socket.destroy here because socket.end caused stalled connection
    // in case of dongles going brutally down without a chance to FIN/ACK
    this?.socket?.destroy();
  }

  /**
   * Sends a message on the client connection.
   * @param baseCastMessage
   * @param data
   * @example
   * ```ts
   * import { Namespaces } from '@cast-web/types';
   * ...
   * this.bus.send({ 'sender-0', 'receiver-0', Namespaces.Connection }, JSON.stringify({ foo: 'bar' }));
   * ```
   */
  public send(baseCastMessage: CastMessageBaseClient, data: CastMessages): void {
    const isBuffer = Buffer.isBuffer(data);
    const message: CastMessageClient = {
      ...baseCastMessage,
      protocolVersion: 0, // CASTV2_1_0
      payloadType: isBuffer ? 1 : 0,
      payloadBinary: isBuffer ? data : undefined,
      payloadUtf8: isBuffer ? undefined : data,
    };

    logger.debug('send', message);

    const buffer = CastMessage.serialize(message);
    this?.packetStream?.send(buffer);
  }

  /**
   * Creates a channel on the client.
   * // TODO: reference Channel
   * @param sourceId
   * @param destinationId
   * @param namespace
   * @param encoding
   * @returns Channel
   * @example
   * ```ts
   * import { ConnectionChannel, Namespaces } from '@cast-web/types';
   * ...
   * const connection = client.createChannel<ConnectionChannel>('sender-0', 'receiver-0', Namespaces.Connection, 'JSON');
   * ```
   */
  public createChannel<
    ChannelType extends ConnectionChannel | HeartbeatChannel | MediaChannel | ReceiverChannel
  >(
    sourceId: CastMessageBaseClient['sourceId'],
    destinationId: CastMessageBaseClient['destinationId'],
    namespace: CastMessageBaseClient['namespace'],
    encoding: ChannelEncoding,
  ): Channel<ChannelType> {
    return new Channel<ChannelType>(this, sourceId, destinationId, namespace, encoding);
  }
}
