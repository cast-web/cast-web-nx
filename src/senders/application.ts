import { Client } from 'cast-protocol/lib/client/client';
import { Sender } from './sender';
import { ConnectionController } from '../controllers/connection';

export class Application extends Sender {

  private connection: any;

  constructor(
    client: Client,
    public session: any,
  ) {
    super(client, Application.randomSenderId(), session.transportId);

    this.session = session;

    // @ts-ignore
    this.connection = this.createController(ConnectionController);
    this.connection.connect();

    this.connection.on('disconnect', this.onApplicationDisconnect);
    this.on('applicationClose', this.onApplicationClose);
  }

  private onApplicationDisconnect() {
    this.emit('applicationClose');
  }

  private onApplicationClose() {
    this.removeListener('applicationClose', this.onApplicationClose);
    this.connection.removeListener('disconnect', this.onApplicationDisconnect);
    this.connection.close();
    this.connection = null;
    this.session = null;
    this.applicationClose();
  }

  private applicationClose(): void {
    this.connection.disconnect();
    this.emit('applicationClose');
  }

  private static randomSenderId(): string {
    return `client-${Math.floor(Math.random() * 10e5)}`;
  }
}
