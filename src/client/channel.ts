import { EventEmitter } from 'events';
import { Client } from './client';
import { CastMessageClient } from '../protocol/google-cast';

export type ChannelEncoding = 'JSON';

export class Channel extends EventEmitter {

  constructor(
    private bus: Client,
    // TODO: refactor BaseCastMessage
    private sourceId: string,
    private destinationId: string,
    private namespace: string,
    private encoding: ChannelEncoding,
  ) {
    super();

    this.bus.on('message', this.onBusMessage);
    this.once('close', this.onClose);
  }

  private onBusMessage(castMessage: CastMessageClient) {
    const {
      sourceId, destinationId, namespace, payloadType, payloadBinary, payloadUtf8,
    } = castMessage;

    if (sourceId !== this.destinationId) return;
    if (destinationId !== this.sourceId && destinationId !== '*') return;
    if (namespace !== this.namespace) return;
    this.emit('message', Channel.decode(payloadType === 1 ? payloadBinary : payloadUtf8, this.encoding), destinationId === '*');
  }

  private onClose() {
    this.bus.removeListener('message', this.onBusMessage);
  }

  public send(data: any): void {
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
