import { Client } from 'cast-protocol/lib/client/client';
import { JsonController } from './json';

export class RequestResponseController extends JsonController {

  private lastRequestId = 0;

  constructor(client: Client, sourceId: string, destinationId: string, namespace: string) {
    super(client, sourceId, destinationId, namespace);
  }

  // TODO: type the callback and the data (!) this is really important
  protected request(data: any, callback: (...args: any) => any): void {
    const requestId = ++this.lastRequestId;

    this.on('message', (response, broadcast) => this.onRequestResponseMessage(response, broadcast, requestId, callback));

    data.requestId = requestId;
    this.send(data);
  }

  // TODO: type callback
  private onRequestResponseMessage(response: any, broadcast: any, requestId?: number, callback?: (...args: any) => any) {
    if (response.requestId === requestId) {
      this.removeListener('message', this.onRequestResponseMessage);

      if (response.type === 'INVALID_REQUEST' && callback) {
        return callback(new Error(`Invalid request: ${response.reason}`));
      }

      delete response.requestId;
      if (callback) { callback(null, response); }
    }
  }
}

module.exports = RequestResponseController;
