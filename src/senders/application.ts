import { Client } from 'cast-protocol/lib/client/client';
import { ReceiverStatusApplication } from 'cast-protocol/src/protocol/google-cast';
import { Sender } from './sender';
import { ConnectionController } from '../controllers/connection';
import { ErrorCallback } from '../controllers/base';

export interface ApplicationSenderEvents {
  error: ErrorCallback;
  status: (data: any) => void;
  applicationClose: any,
}
export class Application extends Sender<ApplicationSenderEvents> {

  private connection: any;
  public session: ReceiverStatusApplication | undefined;

  constructor(
    client: Client,
    session: ReceiverStatusApplication,
  ) {
    super(client, Application.randomSenderId(), session?.transportId);
    if (!session?.transportId) {
      throw new Error('no transport id');
    }

    this.session = session;

    this.connection = new ConnectionController(client, this.senderId, this.receiverId);
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
    this.connection = undefined;
    this.session = undefined;
    this.applicationClose();
  }

  public applicationClose(): void {
    this.connection.disconnect();
    this.emit('applicationClose');
  }

  private static randomSenderId(): string {
    return `client-${Math.floor(Math.random() * 10e5)}`;
  }
}
