import { Client as ProtocolClient } from '@cast-web/protocol';
import { ReceiverChannel, ReceiverStatusApplication } from '@cast-web/types'
import { Sender } from './sender';
import { ConnectionController } from '../controllers/connection';
import { HeartbeatController } from '../controllers/heartbeat';
import { ReceiverController } from '../controllers/receiver';
import { Application } from './application';
import { ErrorCallback } from '../controllers/base';
import { logger } from '../common/logger';

export interface PlatformSenderEvents {
  error: ErrorCallback;
  status: (data: ReceiverChannel['message']['status']) => void;
}

export class PlatformSender extends Sender<PlatformSenderEvents> {

  private connection: ConnectionController | undefined;
  private heartbeat: HeartbeatController | undefined;
  private receiver: ReceiverController | undefined;

  constructor() {
    super(new ProtocolClient(), 'sender-0', 'receiver-0');
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

  private onReceiverStatus(status: ReceiverChannel['message']['status']) {
    this.emit('status', status);
  }

  public async connect(options: any): Promise<void> {
    this?.client?.on('error', this.onClientError);

    await this?.client?.connect(options);
    // TODO: fix this typing weirdness
    this.connection = new ConnectionController(this?.client, this?.senderId, this?.receiverId);
    this.heartbeat = new HeartbeatController(this?.client, this?.senderId, this?.receiverId);
    this.receiver = new ReceiverController(this?.client, this?.senderId, this?.receiverId);

    this?.receiver?.on('status', status => this.onReceiverStatus(status));
    this?.client?.once('close', this.onClientClose);

    this?.heartbeat?.once('timeout', this.onHeartbeatTimeout);

    this?.connection?.connect();
    this?.heartbeat?.start();
  }

  // TODO: rename this?
  public clientClose() {
    this?.client?.close();
  }

  private async getStatus() {
    this?.receiver?.getStatus();
  }

  // TODO: async
  private async getSessions() {
    this?.receiver?.getSessions();
  }

  private async getAppAvailability(appId: string) {
    const availability = await this?.receiver?.getAppAvailability(appId);
    // TODO: oh boi... redo this mutation situation here...
    // eslint-disable-next-line guard-for-in,no-restricted-syntax,no-undef
    for (const key in availability) {
      availability[key] = (availability[key] === 'APP_AVAILABLE');
    }
    return availability;
  }

  public async join<ApplicationType extends Application>(
    session: ReceiverStatusApplication,
    // TODO: typing
    application: { new (...args: any): ApplicationType },
  ) {
    if (!this.client) { throw new Error('Cannot join, no client'); }
    return new application(this.client, session);
  }

  public async launch(application: typeof Application) {
    // TODO: this is defined somewhere...
    // @ts-ignore
    // eslint-disable-next-line consistent-return
    this?.receiver?.launch(application.APP_ID, (err: Error, sessions: any[]) => {
      // TODO: this is defined somewhere...
      // @ts-ignore
      const filtered = sessions.filter(session => session.appId === application.APP_ID);
      const session = filtered.shift();

      return this.join(session, application);
    });
  }

  public async stop(application: Application) {
    logger.warn('stop:')
    const { session } = application;
    // application.applicationClose();
    return this.receiver?.stop(session?.sessionId || '');
  }

  public async setVolume(volume: number) {
    return this.receiver?.setVolume(volume);
  }

  public async getVolume() {
    return this.receiver?.getVolume();
  }
}

export const Client = PlatformSender;
