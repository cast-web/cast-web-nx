import { Client } from 'cast-protocol/lib/client/client';
import { RequestResponseController } from './request-response';

export class ReceiverController extends RequestResponseController {

  constructor(client: Client, sourceId: string, destinationId: string) {
    super(client, sourceId, destinationId, 'urn:x-cast:com.google.cast.receiver');

    this.on('message', this.onReceiverMessage);
    this.once('close', this.onReceiverClose);
  }

  // events

  private onReceiverMessage(data: any, broadcast: any) {
    if (!broadcast) return;
    if (data.type === 'RECEIVER_STATUS') {
      this.emit('status', data.status);
    }
  }

  private onReceiverClose(): void {
    this.removeListener('message', this.onReceiverMessage);
  }

  // protocol

  private getStatus(callback: any) {
    this.request({ type: 'GET_STATUS' }, (err, response) => {
      if (err) return callback(err);
      callback(null, response.status);
    });
  }

  private getAppAvailability(appId: string, callback?: any) {
    // TODO: type this
    const data = {
      type: 'GET_APP_AVAILABILITY',
      appId: Array.isArray(appId) ? appId : [appId],
    };

    this.request(data, (err, response) => {
      if (err) return callback(err);
      callback(null, response.availability);
    });
  }

  private getSessions(callback: any) {
    this.getStatus((err: Error, status: any) => {
      if (err) return callback(err);
      callback(null, status.applications || []);
    });
  }

  private launch(appId: string, callback: any) {
    this.request({ type: 'LAUNCH', appId }, (err, response) => {
      if (err) return callback(err);
      if (response.type === 'LAUNCH_ERROR') {
        return callback(new Error(`Launch failed. Reason: ${response.reason}`));
      }
      callback(null, response.status.applications || []);
    });
  }

  // controls

  private getVolume(callback: any) {
    this.getStatus((err: Error, status: any) => {
      if (err) return callback(err);
      callback(null, status.volume);
    });
  }

  private setVolume(options: any, callback: any) {
    // TODO: type this
    const data = {
      type: 'SET_VOLUME',
      volume: options, // either `{ level: 0.5 }` or `{ muted: true }`
    };

    this.request(data, (err, response) => {
      if (err) return callback(err);
      callback(null, response.status.volume);
    });
  }

  private stop(sessionId: string, callback: any) {
    this.request({ type: 'STOP', sessionId }, (err, response) => {
      if (err) return callback(err);
      callback(null, response.status.applications || []);
    });
  }
}
