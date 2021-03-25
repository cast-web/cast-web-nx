import { Client } from '@cast-web/protocol';
import { HeartbeatChannel, Namespaces } from '@cast-web/types';
import { setTimeout } from 'timers';
import { BaseController, BaseControllerMessage } from './base';

type Timeout = ReturnType<typeof setTimeout>;

export interface HeartbeatControllerEvents {
  pong: () => void;
  timeout: () => void;
}

/**
 * @category Controllers
 */
export class HeartbeatController extends BaseController<
  HeartbeatChannel, HeartbeatControllerEvents
> {

  private readonly DEFAULT_INTERVAL = 5; // seconds
  private readonly TIMEOUT_FACTOR = 3; // timeouts after 3 intervals

  private pingTimer: Timeout | undefined;
  private timeout: Timeout | undefined;
  private intervalValue = this.DEFAULT_INTERVAL;

  constructor(client?: Client, sourceId?: string, destinationId?: string) {
    super(client, sourceId, destinationId, Namespaces.Heartbeat);

    this.on('message', message => this.onHeartbeatMessage(message));
    this.once('close', this.onHeartbeatClose);
  }

  private onHeartbeatMessage(message: BaseControllerMessage<HeartbeatChannel['message']>) {
    if (message.data.type === 'PONG') {
      this.emit('pong');
    }
  }

  private onHeartbeatClose() {
    this.removeListener('message', this.onHeartbeatMessage);
    this.stop();
  }

  // TODO: refactor this, () => () => not elegant and can lead to scope/context issues
  private ping(): void {
    if (this.timeout) {
      // We already have a ping in progress.
      return;
    }

    this.timeout = setTimeout(
      () => this.emit('timeout'),
      this.intervalValue * 1000 * this.TIMEOUT_FACTOR,
    );

    this.once('pong', () => {
      if (this.timeout) { clearTimeout(this.timeout); }
      this.timeout = undefined;

      this.pingTimer = setTimeout(() => {
        this.pingTimer = undefined;
        this.ping();
      }, this.intervalValue * 1000);
    });

    this.send({ type: 'PING' });
  }

  public start(intervalValue?: number): void {
    if (intervalValue) { this.intervalValue = intervalValue; }

    this.ping();
  }

  public stop(): void {
    if (this.pingTimer) { clearTimeout(this.pingTimer); }
    if (this.timeout) { clearTimeout(this.timeout); }

    this.removeAllListeners('pong');
  }

}
