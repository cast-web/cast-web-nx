import { BaseChannel } from 'cast-protocol/lib/protocol/google-cast';
import { BaseController, BaseControllerMessage, ErrorStatusCallback } from './base';
import { logger } from '../common/logger';

export class RequestResponseController<
  ChannelType extends BaseChannel,
  CustomMessages,
> extends BaseController<ChannelType, CustomMessages> {

  private lastRequestId = 0;

  // TODO: type the callback and the data (!) this is really important
  // TODO: get rid of callback
  protected request<T>(data: any, callback: ErrorStatusCallback<T | any>): void {
    const requestId = this.lastRequestId++;
    const payloadData = { ...data, requestId };

    // TODO: fix this message typing
    // @ts-ignore
    this.on('message', message => this.onRequestResponseMessage({
      ...message,
      requestId,
      callback,
    }));

    this.send(payloadData);
  }

  // TODO: This needs mayor rework
  private onRequestResponseMessage(
    message: BaseControllerMessage<ChannelType['data']>,
  ): void {
    logger.debug('onRequestResponseMessage:', message);
    // This is checking if the incoming message.requestId matches the outgoing on
    // i.e. if this is the answer to the message we've been waiting for
    // TODO: add requestId to message.data, since this should be present on every message
    // @ts-ignore
    if (message.data.requestId === message.requestId) {
      // @ts-ignore
      this.removeListener('message', this.onRequestResponseMessage);
      // TODO: this typing is broken as well. rn `data` doesn't contain a response field
      // @ts-ignore
      if (message.data?.response?.type === 'INVALID_REQUEST' && message.callback) {
        // @ts-ignore
        return message.callback(new Error(`Invalid request: ${message.data.reason}`));
      }

      // @ts-ignore
      // eslint-disable-next-line no-param-reassign
      delete message.data.requestId;
      if (message.callback) { message.callback(undefined, message.data); }
    } else {
      // @ts-ignore
      logger.debug('onRequestResponseMessage, requestId mismatch', message.requestId, message.data.requestId);
    }
  }
}
