import { Client } from '@cast-web/protocol';
import { MediaChannel, ReceiverStatusApplication } from '@cast-web/types';
import { Application } from './application';
import { MediaController } from '../controllers/media';
import { logger } from '../common/logger';

export class GenericMediaApplication extends Application {

  private media: MediaController;
  private APP_ID = '';

  constructor(
    public client: Client,
    public session: ReceiverStatusApplication,
  ) {
    super(client, session);

    logger.debug('GenericMediaApplication():', { receiverId: this?.receiverId });
    this.media = new MediaController(client, this?.senderId, this?.receiverId);
    this.media.on('status', (message) => this.onMediaControllerStatus(message));
    logger.debug('GenericMediaApplication():', this.media);
  }

  private onMediaControllerStatus(message: MediaChannel['message']) {
    logger.debug('onMediaControllerStatus:', message);
    this.emit('status', message);
  }

  public async getStatus() {
    return this.media.getStatus();
  }

  public async play() {
    return this.media.play();
  }

  public async pause() {
    return this.media.pause();
  }

  public async stop() {
    return this.media.stop();
  }
}
