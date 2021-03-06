import { Client } from 'cast-protocol/lib/client/client';
import { Sender } from './sender';
import { ConnectionController } from '../controllers/connection';
import { HeartbeatController } from '../controllers/heartbeat';
import { ReceiverController } from '../controllers/receiver';
import { Application } from './application';

export class PlatformSender extends Sender {

  private connection: ConnectionController | undefined;
  private heartbeat: HeartbeatController | undefined;
  private receiver: ReceiverController | undefined;

  constructor() {
    super(new Client(), 'sender-0', 'receiver-0');
  }
  private onClientError(err: Error) {
    this.emit('error', err);
  }

  private onClientClose(): void {
    this?.heartbeat?.stop();
    this?.receiver?.removeListener('status', this.onReceiverStatus);
    this?.receiver?.close();
    this?.heartbeat?.close();
    this?.connection?.close();
    this.receiver = undefined;
    this.heartbeat = undefined;
    this.connection = undefined;
    this.close();
  }

  private onHeartbeatTimeout(): void {
    this.emit('error', new Error('Device timeout'));
  }

  private onReceiverStatus(status: any) {
    this.emit('status', status);
  }

  private connect(options: any, callback: any) {
    this?.client?.on('error', this.onClientError);

    this?.client?.connect(options, () => {
      // TODO: fix this typing weirdness
      // @ts-ignore
      this.connection = this.createController(ConnectionController);
      // @ts-ignore
      this.heartbeat = this.createController(HeartbeatController);
      // @ts-ignore
      this.receiver = this.createController(ReceiverController);

      this?.receiver?.on('status', this.onReceiverStatus);
      this?.client?.once('close', this.onClientClose);

      this?.heartbeat?.once('timeout', this.onHeartbeatTimeout);

      this?.connection?.connect();
      this?.heartbeat?.start();
      callback();
    });
  }

  // TODO: rename this?
  public clientClose() {
    this?.client?.close();
  }

  private getStatus(callback: any) {
    this?.receiver?.getStatus(callback);
  }

  private getSessions(callback: any) {
    this?.receiver?.getSessions(callback);
  }

  private getAppAvailability(appId: string, callback: any) {
    // eslint-disable-next-line consistent-return
    this?.receiver?.getAppAvailability(appId, (err: Error, availability: any) => {
      if (err) return callback(err);
      // TODO: oh boi...
      // eslint-disable-next-line guard-for-in,no-restricted-syntax,no-undef
      for (const key in availability) {
        // eslint-disable-next-line no-param-reassign
        availability[key] = (availability[key] === 'APP_AVAILABLE');
      }
      callback(err, availability);
    });
  }

  private join(session: any, application: Application, callback: any) {
    if (this.client) { callback(null, new Application(this.client, session)); }
  }

  private launch(application: Application, callback: any) {
    // TODO: this is defined somewhere...
    // @ts-ignore
    // eslint-disable-next-line consistent-return
    this?.receiver?.launch(application.APP_ID, (err: Error, sessions: any[]) => {
      if (err) return callback(err);

      // TODO: this is defined somewhere...
      // @ts-ignore
      const filtered = sessions.filter(session => session.appId === application.APP_ID);
      const session = filtered.shift();

      this.join(session, application, callback);
    });
  }

  private stop(application: Application, callback: any) {
    const { session } = application;
    application.close();
    this?.receiver?.stop(session.sessionId, callback);
  }

  private setVolume(volume: number, callback: any) {
    this?.receiver?.setVolume(volume, callback);
  }

  private getVolume(callback: any) {
    this?.receiver?.getVolume(callback);
  }
}
