import { Client, MediaChannel, Namespaces   } from '@cast-web/protocol';
import { RequestResponseController } from './request-response';
import { BaseControllerMessage, StatusCallback } from './base';
import { logger } from '../common/logger';

export interface MediaControllerEvents {
  status: StatusCallback<MediaChannel['message']>;
}

export class MediaController extends RequestResponseController<
  MediaChannel, MediaControllerEvents
> {

  private currentSession: any | undefined;

  constructor(
    client?: Client,
    sourceId?: string,
    destinationId?: string,
  ) {
    super(client, sourceId, destinationId, Namespaces.Media);

    this.currentSession = undefined;

    // eslint-disable-next-line prefer-rest-params
    logger.debug('MediaController():', { client, sourceId, destinationId });
    this.on('message', message => this.onMediaMessage(message));
    this.once('close', this.onMediaClose);
  }

  // events

  private onMediaMessage(message: BaseControllerMessage<MediaChannel['message']>): void {
    logger.debug('onMediaMessage:', message);
    if (message.data.type === 'MEDIA_STATUS' && message.broadcast) {
      // TODO: check typing, why is this an array?
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

  private sessionRequest(data: any, callback: any) {
    const messageData = { ...data, mediaSessionId: this.currentSession.mediaSessionId };

    this.request(messageData, (err, response) => {
      if (err) return callback(err);
      const status = response.status[0];
      callback(null, status);
    });
  }

  // TODO: promise
  public getStatus(callback?: any) {
    this.request({ type: 'GET_STATUS' }, (err, response) => {
      if (err) return callback(err);
      const status = response.status[0];
      this.currentSession = status;
      callback(null, status);
    });
  }

  // controls

  public stop(callback?: any) {
    this.sessionRequest({ type: 'STOP' }, callback);
  }

  public play(callback?: any) {
    this.sessionRequest({ type: 'PLAY' }, callback);
  }

  public pause(callback?: any) {
    this.sessionRequest({ type: 'PAUSE' }, callback);
  }

  public seek(currentTime: any, callback: any) {
    const data = {
      type: 'SEEK',
      currentTime,
    };

    this.sessionRequest(data, callback);
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
