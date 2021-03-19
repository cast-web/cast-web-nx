import {
  CastMessageBaseClient,
  CastMessageClient,
  ConnectionChannel,
  HeartbeatChannel, MediaChannel,
  Namespaces, ReceiverChannel,
} from '../protocol/google-cast';
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

  public send(data: ChannelType['data']): void {
    logger.debug('send:', data);
    const { sourceId, destinationId, namespace } = this;
    this.bus.send(
      { sourceId, destinationId, namespace },
      Channel.encode(data, this.encoding),
    );
  }

  public close(): void {
    this.emit('close');
  }

  public static encode(data: any, encoding: ChannelEncoding) {
    if (!encoding) return data;
    switch (encoding) {
      case 'JSON': return JSON.stringify(data);
      default: throw new Error(`Unsupported channel encoding: ${encoding}`);
    }
  }

  public static decode(data: any, encoding: ChannelEncoding) {
    if (!encoding) return data;
    switch (encoding) {
      case 'JSON': return JSON.parse(data);
      default: throw new Error(`Unsupported channel encoding: ${encoding}`);
    }
  }
}
