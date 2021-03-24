import { Client } from '@cast-web/protocol';
import { MediaChannel, Namespaces } from '@cast-web/types';
import { RequestResponseController } from './request-response';
import { BaseControllerEvents, BaseControllerMessage, StatusCallback } from './base';
import { logger } from '../common/logger';

export interface MediaControllerEvents extends BaseControllerEvents<MediaChannel['message']> {
  status: StatusCallback<MediaChannel['message']>;
}

export class MediaController extends RequestResponseController<
  MediaChannel, MediaControllerEvents
> {

  private currentSession: MediaChannel['message'];

  constructor(
    client?: Client,
    sourceId?: string,
    destinationId?: string,
  ) {
    super(client, sourceId, destinationId, Namespaces.Media);

    this.currentSession = undefined;

    logger.debug('MediaController():', { client, sourceId, destinationId });
    this.on('message', message => this.onMediaMessage(message));
    this.once('close', this.onMediaClose);
    // This is not part of the protocol I guess. However other re-implementations also do this
    // Some CastReceivers don't send a MEDIA_STATUS on connect.
    // THis fixes that.
    this.getStatus();
  }

  // events

  private onMediaMessage(message: BaseControllerMessage<MediaChannel['message']>): void {
    logger.warn('onMediaMessage:', message.broadcast);
    // there used to be a message.broadcast condition
    // i guess this was here to prevent reqResp message to be parsed (i.e. parsed twice)
    if (message.data.type === 'MEDIA_STATUS') {
      // TODO: check typing, why is this an array?
      // well it is an array
      // @ts-ignore
      const status = message.data.status[0] as MediaChannel['message'];
      // Sometimes an empty status array can come through; if so don't emit it
      if (!status) return;
      this.currentSession = status;
      // @ts-ignore
      this.emit('status', { message: status });
    }
  }

  // protocol

  private onMediaClose(): void {
    this.removeListener('message', this.onMediaMessage);
    this.stop();
  }

  private async sessionRequest(data: Omit<MediaChannel['data'], 'requestId' | 'sessionId'>) {
    if (!this.currentSession?.mediaSessionId) {
      logger.warn('currentSession: ', this.currentSession);
      return;
    }
    // TODO: currentSession (and mediaSessionId) can be undefined
    const messageData = { ...data, mediaSessionId: this.currentSession?.mediaSessionId };

    // TODO: this was the old data structure: const status = response.status[0];
    // TODO: sessionId is missing? idk why... afaik we need mediaSessionId and sessionId for a media request
    // @ts-ignore
    return (await this.request(messageData, this.currentSession));
  }

  // TODO: promise
  public async getStatus() {
    // TODO: this was the old data structure: const status = response.status[0];
    // @ts-ignore
    return (await this.request({ type: 'GET_STATUS' }));
  }

  // controls

  public async stop() {
    return (await this.sessionRequest({ type: 'STOP' }));
  }

  public async play() {
    return (await this.sessionRequest({ type: 'PLAY' }));
  }

  public async pause() {
    return (await this.sessionRequest({ type: 'PAUSE' }));
  }

  public async seek(currentTime: number) {
    return (await this.sessionRequest( { type: 'SEEK', currentTime }));
  }

  // load

  // public load(media: any, options: any, callback?: any) {
  //   if (typeof options === 'function' || typeof options === 'undefined') {
  //     callback = options;
  //     options = {};
  //   }
  //
  //   // TODO: type this
  //   const data: any = { type: 'LOAD' };
  //
  //   data.autoplay = (typeof options.autoplay !== 'undefined')
  //     ? options.autoplay
  //     : false;
  //
  //   data.currentTime = (typeof options.currentTime !== 'undefined')
  //     ? options.currentTime
  //     : 0;
  //
  //   data.activeTrackIds = (typeof options.activeTrackIds !== 'undefined')
  //     ? options.activeTrackIds
  //     : [];
  //
  //   data.repeatMode = (typeof options.repeatMode === 'string'
  //     && typeof options.repeatMode !== 'undefined')
  //     ? options.repeatMode
  //     : 'REPEAT_OFF';
  //
  //   data.media = media;
  //
  //   this.request(data, (err, response) => {
  //     if (err) return callback(err);
  //     if (response.type === 'LOAD_FAILED') {
  //       return callback(new Error('Load failed'));
  //     }
  //     if (response.type === 'LOAD_CANCELLED') {
  //       return callback(new Error('Load cancelled'));
  //     }
  //     const status = response.status[0];
  //     callback(null, status);
  //   });
  // }

  // queue

  // Load a queue of items to play (playlist)
  // See https://developers.google.com/cast/docs/reference/chrome/chrome.cast.media.QueueLoadRequest

  // public queueLoad(items: any[], options: any, callback?: any) {
  //   if (typeof options === 'function' || typeof options === 'undefined') {
  //     callback = options;
  //     options = {};
  //   }
  //
  //   // TODO: type this
  //   const data: any = { type: 'QUEUE_LOAD' };
  //
  //   // REPEAT_OFF, REPEAT_ALL, REPEAT_SINGLE, REPEAT_ALL_AND_SHUFFLE
  //   data.repeatMode = (typeof options.repeatMode === 'string'
  //     && typeof options.repeatMode !== 'undefined')
  //     ? options.repeatMode
  //     : 'REPEAT_OFF';
  //
  //   data.currentTime = (typeof options.currentTime !== 'undefined')
  //     ? options.currentTime
  //     : 0;
  //
  //   data.startIndex = (typeof options.startIndex !== 'undefined')
  //     ? options.startIndex
  //     : 0;
  //
  //   data.items = items;
  //
  //   this.request(data, (err, response) => {
  //     if (err) return callback(err);
  //     if (response.type === 'LOAD_FAILED') {
  //       return callback(new Error('queueLoad failed'));
  //     }
  //     if (response.type === 'LOAD_CANCELLED') {
  //       return callback(new Error('queueLoad cancelled'));
  //     }
  //     const status = response.status[0];
  //     callback(null, status);
  //   });
  // }
  //
  // public queueInsert(items: any[], options: any, callback?: any) {
  //   if (typeof options === 'function' || typeof options === 'undefined') {
  //     callback = options;
  //     options = {};
  //   }
  //
  //   // TODO: type this
  //   const data = {
  //     type: 'QUEUE_INSERT',
  // eslint-disable-next-line max-len
  //     currentItemId: options.currentItemId, // Item ID to play after this request or keep same item if undefined
  // eslint-disable-next-line max-len
  //     currentItemIndex: options.currentItemIndex, // Item Index to play after this request or keep same item if undefined
  //     currentTime: options.currentTime, // Seek in seconds for current stream
  //     insertBefore: options.insertBefore, // ID or append if undefined
  //     items,
  //   };
  //
  //   this.sessionRequest(data, callback);
  // }
  //
  // public queueRemove(itemIds: string[], options: any, callback?: any) {
  //   if (typeof options === 'function' || typeof options === 'undefined') {
  //     callback = options;
  //     options = {};
  //   }
  //
  //   // TODO: type this
  //   const data = {
  //     type: 'QUEUE_REMOVE',
  //     currentItemId: options.currentItemId,
  //     currentTime: options.currentTime,
  //     itemIds,
  //   };
  //
  //   this.sessionRequest(data, callback);
  // }
  //
  // public queueReorder(itemIds: string[], options: any, callback?: any) {
  //   if (typeof options === 'function' || typeof options === 'undefined') {
  //     callback = options;
  //     options = {};
  //   }
  //
  //   // TODO: type this
  //   const data = {
  //     type: 'QUEUE_REORDER',
  //     currentItemId: options.currentItemId,
  //     currentTime: options.currentTime,
  //     insertBefore: options.insertBefore,
  //     itemIds,
  //   };
  //
  //   this.sessionRequest(data, callback);
  // }
  //
  // public queueUpdate(items: string[], options: any, callback?: any) {
  //   if (typeof options === 'function' || typeof options === 'undefined') {
  //     callback = options;
  //     options = {};
  //   }
  //
  //   // TODO: type this
  //   const data = {
  //     type: 'QUEUE_UPDATE',
  //     currentItemId: options.currentItemId,
  //     currentTime: options.currentTime,
  //     jump: options.jump, // Skip or go back (if negative) number of items
  //     repeatMode: options.repeatMode,
  //     items,
  //   };
  //
  //   this.sessionRequest(data, callback);
  // }
}
