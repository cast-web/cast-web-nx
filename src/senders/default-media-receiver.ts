import { Client } from 'cast-protocol/lib/client/client';
import { MediaController } from '../controllers/media';
import { Application } from './application';

export class DefaultMediaReceiver extends Application {

  private readonly APP_ID = 'CC1AD845';
  private media: MediaController;

  constructor(client: Client, session: any) {
    super(client, session);

    // TODO: fix this weirdness in parent
    // @ts-ignore
    this.media = this.createController(MediaController);

    this.media.on('status', this.onDefaultMediaReceiverStatus);

  }

  private onDefaultMediaReceiverStatus(status: any) {
    this.emit('status', status);
  }

  private getStatus(callback: any) {
    this.media.getStatus(callback);
  }

  private load(media: any, options: any, callback: any) {
    this.media.load(media, options, callback);
  }

  private play(callback: any) {
    this.media.play(callback);
  }

  private pause(callback: any) {
    this.media.pause(callback);
  }

  private stop(callback: any) {
    this.media.stop(callback);
  }

  private seek(currentTime: any, callback: any) {
    this.media.seek(currentTime, callback);
  }

  // queue

  private queueLoad(items: any[], options: any, callback: any) {
    this.media.queueLoad(items, options, callback);
  }

  private queueInsert(items: any[], options: any, callback: any) {
    this.media.queueInsert(items, options, callback);
  }

  private queueRemove(itemIds: string[], options: any, callback: any) {
    this.media.queueRemove(itemIds, options, callback);
  }

  private queueReorder(itemIds: string[], options: any, callback: any) {
    this.media.queueReorder(itemIds, options, callback);
  }

  private queueUpdate(items: any[], callback: any) {
    // TODO: typing broken either here or in parent
    this.media.queueUpdate(items, callback);
  }

}
