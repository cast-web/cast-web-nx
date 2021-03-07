import { BaseJsonController, ErrorStatusCallback } from './base';

export class RequestResponseController extends BaseJsonController {

  private lastRequestId = 0;

  // TODO: type the callback and the data (!) this is really important
  protected request<T>(data: any, callback: ErrorStatusCallback<T | any>): void {
    const requestId = this.lastRequestId++;
    const payloadData = { ...data, requestId };

    this.on('message', (response, broadcast) => this.onRequestResponseMessage(response, broadcast, requestId, callback));

    this.send(payloadData);
  }

  // TODO: type callback
  private onRequestResponseMessage<T>(
    response: any,
    broadcast: any,
    requestId?: number,
    callback?: ErrorStatusCallback<T>
  ): void {
    if (response.requestId === requestId) {
      this.removeListener('message', this.onRequestResponseMessage);

      if (response.type === 'INVALID_REQUEST' && callback) {
        return callback(new Error(`Invalid request: ${response.reason}`));
      }

      delete response.requestId;
      if (callback) { callback(undefined, response); }
    }
  }
}

module.exports = RequestResponseController;
