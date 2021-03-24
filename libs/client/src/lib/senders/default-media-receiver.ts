import { Client } from '@cast-web/protocol';
import { MediaController } from '../controllers/media';
import { Application } from './application';

export class DefaultMediaReceiver extends Application {

  private readonly APP_ID = 'CC1AD845';
  private media: MediaController;

  constructor(client: Client, session: any) {
    super(client, session);

    this.media = new MediaController(client, this?.senderId, this?.receiverId);

    this.media.on('status', this.onDefaultMediaReceiverStatus);
  }

  private onDefaultMediaReceiverStatus(status: any) {
    this.emit('status', status);
  }

  public async getStatus() {
    return this.media.getStatus();
  }

  // private load(media: any, options: any, callback: any) {
  //   this.media.load(media, options, callback);
  // }

  public async play() {
    return this.media.play();
  }

  public async pause() {
    return this.media.pause();
  }

  public async stop() {
    return this.media.stop();
  }

  public async seek(currentTime: any) {
    return this.media.seek(currentTime);
  }

  // queue

  // private queueLoad(items: any[], options: any, callback: any) {
  //   this.media.queueLoad(items, options, callback);
  // }
  //
  // private queueInsert(items: any[], options: any, callback: any) {
  //   this.media.queueInsert(items, options, callback);
  // }
  //
  // private queueRemove(itemIds: string[], options: any, callback: any) {
  //   this.media.queueRemove(itemIds, options, callback);
  // }
  //
  // private queueReorder(itemIds: string[], options: any, callback: any) {
  //   this.media.queueReorder(itemIds, options, callback);
  // }
  //
  // private queueUpdate(items: any[], callback: any) {
  //   // TODO: typing broken either here or in parent
  //   this.media.queueUpdate(items, callback);
  // }

}
