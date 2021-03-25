import { RequestChannel } from '@cast-web/types';
import { BaseController, BaseControllerEvents, BaseControllerMessage } from './base';
import { logger } from '../common/logger';

 /**
  * Matches a message request to an incoming response.
  *
  * @category Controllers
  * @example
  * TODO:
  */
export class RequestResponseController<
  ChannelType extends RequestChannel,
  CustomMessages extends Partial<BaseControllerEvents<ChannelType['message']>>,
> extends BaseController<ChannelType, CustomMessages> {

  private lastRequestId = 0;

   /**
    * Sends a request and returns a response.
    *
    * @example
    * TODO:
    *
    * @param data
    * @protected
    * @returns Message Data | Rejects on Error
    */
  protected request<T>(data: Omit<ChannelType['data'], 'requestId'>): Promise<ChannelType['message']> {
    const requestId = this.lastRequestId++;
    const payloadData = { ...data, requestId } as ChannelType['data'];

    const promise = new Promise<ChannelType['message']>((resolve, reject) => {
      this.on('message', message => {
       const res = this.onRequestResponseMessage({ ...message, requestId });
       if (res) { res instanceof Error ? reject(res) : resolve(res) }
      });
    });

    this.send(payloadData);
    return promise;
  }

   /**
    * Parses incoming messages and check's for requestId match.
    *
    * @remarks
    * This is checking if the incoming message.requestId matches
    * the outgoing one. Is this the answer to the message we've sent.
    *
    * @example
    * TODO:
    *
    * @param message
    * @private
    * @returns Message Data | Error | (undefined requestId mismatch).
    */
  private onRequestResponseMessage(
    message: BaseControllerMessage<ChannelType['message']>,
  ): ChannelType['message'] | Error | undefined {
    logger.debug('onRequestResponseMessage:', message);
    if (message?.data?.requestId === message?.requestId) {
      this.removeListener('message', this.onRequestResponseMessage);
      // TODO: typing broken. rn `data` doesn't contain a response field
      // @ts-ignore
      if (message.data?.response?.type === 'INVALID_REQUEST') {
        // TODO: typing broken. rn `data` doesn't contain a reason field
        // @ts-ignore
        return new Error(`Invalid request: ${message.data?.reason}`);
      }

      delete message.data.requestId;
      return message?.data;
    } else {
      logger.debug('onRequestResponseMessage, requestId mismatch', message.requestId, message.data.requestId);
      return undefined;
    }
  }
}
