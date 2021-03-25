import { Client, Channel, ChannelEncoding } from '@cast-web/protocol';
import { BaseChannel, Namespaces } from '@cast-web/types';
import { TypedEmitter } from '../common/typed-emitter';
import { logger } from '../common/logger';

export type ErrorCallback = (error: Error) => void;
export type StatusCallback<T> = (status: T) => void;
export type MessageCallback<T> = (message: T) => void;

export interface BaseControllerMessage<MessageDataType> {
  data: MessageDataType;
  broadcast: boolean;
  // TODO: this is really broken; requestId/callback only required in ./request-response
  requestId?: number;
}

export interface BaseControllerEvents<MessageDataType> {
  // CTRL - CHANNEL
  message: MessageCallback<BaseControllerMessage<MessageDataType>>;
  // CTRL - CHANNEL
  close: () => void;
}

/**
 * @category Base
 */
export class BaseController<
  ChannelType extends BaseChannel,
  CustomMessages,
> extends TypedEmitter<
  BaseControllerEvents<ChannelType['message']> & CustomMessages
> {

  private channel: Channel<ChannelType> | undefined;

  // TODO: better typing in cast-protocol lib
  constructor(
    client?: Client,
    sourceId?: string,
    destinationId?: string,
    namespace?: Namespaces,
    encoding: ChannelEncoding = 'JSON',
  ) {
    super();

    if (sourceId && destinationId && namespace && encoding) {
      this.channel = client?.createChannel(sourceId, destinationId, namespace, encoding);
      this.channel?.on('message', (data, broadcast) => this.onControllerMessage(data, broadcast));
      this.channel?.once('close', this.onControllerClose);
    }
  }

  private onControllerMessage(data: ChannelType['message'], broadcast: any): void {
    const base: BaseControllerMessage<ChannelType['message']> = {
      data,
      broadcast,
    };
    logger.debug('onControllerMessage:', base);
    // TODO: somehow it doesn't tsc without this
    // @ts-ignore
    this.emit('message', base);
  }

  private onControllerClose(): void {
    this.channel?.removeListener('message', this.onControllerMessage);
    // TODO: somehow it doesn't tsc without this
    // @ts-ignore
    this.emit('close');
  }

  protected send(data: ChannelType['data']): void {
    this.channel?.send(data);
  }

  public close(): void {
    this.channel?.close();
  }
}
