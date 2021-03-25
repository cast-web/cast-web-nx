import {
  CastMessageBaseClient,
  CastMessageClient,
  ConnectionChannel,
  HeartbeatChannel,
  MediaChannel,
  ReceiverChannel,
} from '@cast-web/types';
import { TypedEmitter } from '../common/typed-emitter';
import { logger } from '../common/logger';
import { Client } from './client';

export type ChannelEncoding = 'JSON';

export interface ChannelEvents<
  ChannelType extends ConnectionChannel | HeartbeatChannel | MediaChannel | ReceiverChannel
> {
  error: (error: Error) => void;
  message: (message: ChannelType['message'], broadcast: boolean) => void;
  close: () => void;
  connect: () => void;
}

/**
 * Wraps a channel on a client bus.
 * @example
 * ```ts
 * import { Client } from '@cast-web/protocol';
 * import {
 *   ConnectionChannel,
 *   HeartbeatChannel,
 *   ReceiverChannel,
 *   Namespaces,
 * } from '@cast-web/types';
 *
 * const client = new Client();
 * // wait for the client to connect
 * await client.connect({ host: '192.168.1.101' });
 *
 * // create channels
 * const connection = client.createChannel<ConnectionChannel>('sender-0', 'receiver-0', Namespaces.Connection, 'JSON');
 * const heartbeat = client.createChannel<HeartbeatChannel>('sender-0', 'receiver-0', Namespaces.Heartbeat, 'JSON');
 * const receiver = client.createChannel<ReceiverChannel>('sender-0', 'receiver-0', Namespaces.Receiver, 'JSON');
 *
 * // listen to channel events (receiver as an example)
 * receiver.on('connect', () => console.log('receiver connect'));
 * receiver.on('close', () => console.log('receiver close'));
 * receiver.on('error', error => console.log('receiver error:', error));
 * receiver.on('message', message => console.log('receiver message:', message));
 *
 * // connect to the receiver
 * connection.send({ type: 'CONNECT' });
 *
 * // start the heartbeat
 * setInterval(() => heartbeat.send({ type: 'PING' }), 5000);
 * ```
 */
export class Channel<
  ChannelType extends ConnectionChannel | HeartbeatChannel | MediaChannel | ReceiverChannel
> extends TypedEmitter<ChannelEvents<ChannelType>> {

  constructor(
    private bus: Client,
    private sourceId: CastMessageBaseClient['sourceId'],
    private destinationId: CastMessageBaseClient['destinationId'],
    private namespace: CastMessageBaseClient['namespace'],
    private encoding: ChannelEncoding,
  ) {
    super();

    this.bus.on('message', (message: any) => this.onBusMessage(message));
    this.once('close', () => this.onClose());
  }

  private onBusMessage(castMessage: CastMessageClient) {
    const {
      sourceId, destinationId, namespace, payloadType, payloadBinary, payloadUtf8,
    } = castMessage;

    logger.debug('onBusMessage:', castMessage);

    if (sourceId !== this.destinationId) return;
    if (destinationId !== this.sourceId && destinationId !== '*') return;
    if (namespace !== this.namespace) return;
    this.emit('message', Channel.decode(payloadType === 1 ? payloadBinary : payloadUtf8, this.encoding), destinationId === '*');
  }

  private onClose() {
    this.bus.removeListener('message', this.onBusMessage);
  }

  /**
   * Sends data on the channel.
   * @param data - depend on channel type
   * @returns void
   * @example
   * ```ts
   * // ConnectionChannel
   * connection.send({ type: 'CONNECT' });
   * ```
   */
  public send(data: ChannelType['data']): void {
    logger.debug('send:', data);
    const { sourceId, destinationId, namespace } = this;
    this.bus.send(
      { sourceId, destinationId, namespace },
      Channel.encode(data, this.encoding),
    );
  }

  /**
   * Closes the channel
   * @remarks This is important to prevent EventEmitter leaks.
   */
  public close(): void {
    this.emit('close');
  }

  /**
   * Encodes data to be sent on a channel.
   * @param data
   * @param encoding
   * @returns Encoded data.
   */
  public static encode(data: any, encoding: ChannelEncoding): any {
    if (!encoding) return data;
    switch (encoding) {
      case 'JSON': return JSON.stringify(data);
      default: throw new Error(`Unsupported channel encoding: ${encoding}`);
    }
  }

  /**
   * Decodes data received on a channel
   * @param data
   * @param encoding
   * @returns JS expresion of the data.
   */
  public static decode(data: any, encoding: ChannelEncoding): any {
    if (!encoding) return data;
    switch (encoding) {
      case 'JSON': return JSON.parse(data);
      default: throw new Error(`Unsupported channel encoding: ${encoding}`);
    }
  }
}
