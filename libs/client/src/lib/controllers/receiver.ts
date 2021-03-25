import { Client } from '@cast-web/protocol';
import { Namespaces, ReceiverChannel } from '@cast-web/types'
import { RequestResponseController } from './request-response';
import { BaseControllerEvents, BaseControllerMessage, StatusCallback } from './base';

export interface ReceiverControllerEvents extends BaseControllerEvents<ReceiverChannel['message']> {
  status: StatusCallback<ReceiverChannel['message']['status']>;
}


/**
 * @category Controllers
 */
export class ReceiverController extends RequestResponseController<
  ReceiverChannel, ReceiverControllerEvents
> {

  constructor(client?: Client, sourceId?: string, destinationId?: string) {
    super(client, sourceId, destinationId, Namespaces.Receiver);

    this.on('message', message => this.onReceiverMessage(message));
    this.once('close', () => this.onReceiverClose());
  }

  // events

  private onReceiverMessage(message: BaseControllerMessage<ReceiverChannel['message']>) {
    if (!message.broadcast) return;
    if (message.data.type === 'RECEIVER_STATUS') {
      this.emit('status', message.data.status);
    }
  }

  private onReceiverClose(): void {
    this.removeListener('message', this.onReceiverMessage);
  }

  // protocol

  public async getStatus(): Promise<ReceiverChannel['message']['status']> {
    return (await this.request({ type: 'GET_STATUS' })).status;
  }

  // TODO: appId can also be an string[]
  public async getAppAvailability(appId: string): Promise<any> {
    // TODO: type message.availability
    // @ts-ignore
    return (await this.request({ type: 'GET_APP_AVAILABILITY', appId })).availibility;
  }

  public async getSessions(): Promise<ReceiverChannel['message']['status']['applications']> {
    return (await this.getStatus()).applications || [];
  }

  public async launch(appId: string): Promise<ReceiverChannel['message']['status']['applications']> {
    const response = await this.request({ type: 'LAUNCH', appId });

    // TODO: add LAUNCH_ERROR to receiver data types
    // TODO: add reason to receiver data types
    // @ts-ignore
    return response.type === 'LAUNCH_ERROR' ? new Error(`Launch failed. Reason: ${ response?.reason }`) : response?.status?.applications || [];
  }

  // controls

  public async getVolume(): Promise<ReceiverChannel['message']['status']['volume']> {
    return (await this.getStatus()).volume;
  }

  public async setVolume(options: any): Promise<ReceiverChannel['message']['status']['volume']> {
    // TODO: type the volume (options) object: // either `{ level: 0.5 }` or `{ muted: true }`
    return (await this.request({ type: 'SET_VOLUME', volume: options }))?.status?.volume;
  }

  public async stop(sessionId: string): Promise<ReceiverChannel['message']['status']['applications']> {
    // TODO: shouldn't this be part of media? it requires a sessionId... iirc that was optional though
    // @ts-ignore
    return (await this.request({ type: 'STOP', sessionId }))?.status?.applications || [];
  }
}
