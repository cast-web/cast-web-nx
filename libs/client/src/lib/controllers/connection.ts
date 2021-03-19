import { Client } from 'cast-protocol/lib/client/client';
import { ConnectionChannel, Namespaces } from 'cast-protocol/lib/protocol/google-cast';
import { BaseController, BaseControllerMessage } from './base';

export interface ConnectionControllerEvents {
  disconnect: () => void;
}

export class ConnectionController extends BaseController<
  ConnectionChannel, ConnectionControllerEvents
> {

  constructor(client?: Client, sourceId?: string, destinationId?: string) {
    super(client, sourceId, destinationId, Namespaces.Connection);

    this.on('message', (message) => this.onConnectionControllerMessage(message));
    this.once('close', this.onConnectionControllerClose);
  }

  private onConnectionControllerMessage(message: BaseControllerMessage<any>): void {
    if (message.data.type === 'CLOSE') {
      this.emit('disconnect');
    }
  }

  private onConnectionControllerClose(): void {
    this.removeListener('message', this.onConnectionControllerMessage);
  }

  public connect(): void {
    this.send({ type: 'CONNECT' });
  }

  public disconnect(): void {
    this.send({ type: 'CLOSE' });
  }
}
