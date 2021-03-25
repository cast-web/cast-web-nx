import { Client as ProtocolClient, ClientConnectOptions } from '@cast-web/protocol';
import { ReceiverChannel, ReceiverStatus, ReceiverStatusApplication } from '@cast-web/types'
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

/**
 * This represents a Google Cast Client (a Chromecast).
 *
 * @category Senders
 * @example
 * ```ts
 * const myDevice = new Client();
 * await myDevice.connect({ host: '192.168.1.101', port: 8009 });
 *
 * myDevice.on('status', status => console.log('myDevice status:', status));
 * myDevice.on('error', error => console.log('myDevice error:', error));
 * ```
 */
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

  /**
   * Connects to the client.
   * @param options - ClientConnectOptions
   * @returns Promise<void> - indicating connection established.
   */
  public async connect(options: ClientConnectOptions): Promise<void> {
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

  /**
   * Closes the client and removes all listeners.
   * @remarks
   * This is important to prevent memory leaks. The client will close automatically
   * should one of the channels close.
   */
  public clientClose() {
    this?.client?.close();
  }

  /**
   * Queries for current ReceiverStatus.
   * @remarks
   * This does trigger the 'status' EventEmitter.
   * @returns
   * The current ReceiverStatus.
   */
  public async getStatus(): Promise<ReceiverStatus['status']> {
    return this?.receiver?.getStatus();
  }

  /**
   * Queries for currently running applications.
   * @remarks
   * This does trigger the 'status' EventEmitter.
   * @returns
   * Array with the currently running application ids.
   */
  public async getSessions(): Promise<ReceiverStatus['status']['applications']> {
    return this?.receiver?.getSessions();
  }

  /**
   * Checks if appId is available on the receiver.
   * @param appId
   * @returns
   * TODO:
   */
  public async getAppAvailability(appId: string) {
    const availability = await this?.receiver?.getAppAvailability(appId);
    // TODO: oh boi... redo this mutation situation here...
    // eslint-disable-next-line guard-for-in,no-restricted-syntax,no-undef
    for (const key in availability) {
      availability[key] = (availability[key] === 'APP_AVAILABLE');
    }
    return availability;
  }

  /**
   * Joins the currently running Application.
   * @param session
   * @param application
   * @remarks
   * Join as a generic Application to get basic controls. (TODO: reference)
   * Use a matching Application for better control support.
   * TODO: application list with reference
   * @example
   * ```ts
   * myDevice.on('status', async status => {
   *  const session = (data?.applications || [])[0];
   *
   *  if (session?.sessionId) {
   *    console.log('joining session:', session);
   *    const application = await tobiasHome.join<ApplicationClass>(session, ApplicationClass);
   *    console.log('joined application:', application);
   *    // TODO: reference Application doc
   *  }
   * });
   * ```
   */
  public async join<ApplicationType extends Application>(
    session: ReceiverStatusApplication,
    // TODO: typing
    application: { new (...args: any): ApplicationType },
  ) {
    if (!this.client) { throw new Error('Cannot join, no client'); }
    return new application(this.client, session);
  }

  /**
   * Launches specified application.
   * @param application
   * @returns application
   * @example TODO:
   */
  public async launch(application: typeof Application): Promise<Application> {
    // TODO: this is defined somewhere...
    // @ts-ignore
    const sessions = await this?.receiver?.launch(application.APP_ID);
    // TODO: redo this
    // TODO: this is defined somewhere...
    // @ts-ignore
    const filtered = sessions.filter(session => session.appId === application.APP_ID);
    const session = filtered.shift();

    return this.join(session, application);
  }

  /**
   * Stops the specified application.
   * @param application
   * @returns ReceiverStatusApplication[] - list of sessions
   */
  public async stop(application: Application) {
    logger.warn('stop:')
    const { session } = application;
    // application.applicationClose();
    return this.receiver?.stop(session?.sessionId || '');
  }

  /**
   * Sets the device volume.
   * @param volume
   * @returns volume - the new volume
   */
  public async setVolume(volume: number) {
    return this.receiver?.setVolume(volume);
  }

  /**
   * Gets the device volume.
   * @returns volume - the current volume
   */
  public async getVolume() {
    return this.receiver?.getVolume();
  }
}

export const Client = PlatformSender;
