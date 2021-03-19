import { Client } from 'cast-protocol/lib/client/client';
import { Namespaces, ReceiverChannel } from 'cast-protocol/lib/protocol/google-cast';
import { RequestResponseController } from './request-response';
import { BaseControllerMessage, ErrorStatusCallback, StatusCallback } from './base';

export interface ReceiverControllerEvents {
  status: StatusCallback<ReceiverChannel['message']['status']>;
}

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

  // TODO: Type this!
  public getStatus(callback: ErrorStatusCallback<any>) {
    this.request({ type: 'GET_STATUS' }, (err, response) => {
      if (err) return callback(err);
      callback(undefined, response.status);
    });
  }

  public getAppAvailability(appId: string, callback: ErrorStatusCallback<any>) {
    // TODO: type this
    const data = {
      type: 'GET_APP_AVAILABILITY',
      appId: Array.isArray(appId) ? appId : [appId],
    };

    this.request(data, (err, response) => {
      if (err) return callback(err);
      callback(undefined, response.availability);
    });
  }

  public getSessions(callback: ErrorStatusCallback<any>) {
    this.getStatus((err, status) => {
      if (err) return callback(err);
      callback(undefined, status.applications || []);
    });
  }

  public launch(appId: string, callback: ErrorStatusCallback<any>) {
    this.request({ type: 'LAUNCH', appId }, (err, response) => {
      if (err) return callback(err);
      if (response.type === 'LAUNCH_ERROR') {
        return callback(new Error(`Launch failed. Reason: ${response.reason}`));
      }
      callback(undefined, response.status.applications || []);
    });
  }

  // controls

  public getVolume(callback: ErrorStatusCallback<number>) {
    this.getStatus((err, status) => {
      if (err) return callback(err);
      callback(undefined, status.volume);
    });
  }

  public setVolume(options: any, callback: ErrorStatusCallback<any>) {
    // TODO: type this
    const data = {
      type: 'SET_VOLUME',
      volume: options, // either `{ level: 0.5 }` or `{ muted: true }`
    };

    this.request(data, (err, response) => {
      if (err) return callback(err);
      callback(undefined, response.status.volume);
    });
  }

  public stop(sessionId: string, callback: ErrorStatusCallback<any>) {
    this.request({ type: 'STOP', sessionId }, (err, response) => {
      if (err) return callback(err);
      callback(undefined, response.status.applications || []);
    });
  }
}
