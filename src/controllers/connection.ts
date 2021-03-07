import { Client } from 'cast-protocol/lib/client/client';
import { BaseJsonController } from './base';

export class ConnectionController extends BaseJsonController {

  constructor(client: Client, sourceId: string, destinationId: string) {
    super(client, sourceId, destinationId, 'urn:x-cast:com.google.cast.tp.connection');

    this.on('message', this.onConnectionControllerMessage);
    this.once('close', this.onConnectionControllerClose);
  }

  private onConnectionControllerMessage(data: any, broadcast: any): void {
    if (data.type === 'CLOSE') {
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

module.exports = ConnectionController;
