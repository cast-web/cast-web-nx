import { Client } from 'cast-protocol/lib/client/client';
import { JsonController } from './json';
import Timeout = NodeJS.Timeout;

export class HeartbeatController extends JsonController {

  private readonly DEFAULT_INTERVAL = 5; // seconds
  private readonly TIMEOUT_FACTOR = 3; // timeouts after 3 intervals

  private pingTimer: Timeout | undefined;
  private timeout: Timeout | undefined;
  private intervalValue = this.DEFAULT_INTERVAL;

  constructor(client: Client, sourceId: string, destinationId: string) {
    // TODO: type the namespaces
    super(client, sourceId, destinationId, 'urn:x-cast:com.google.cast.tp.heartbeat');

    this.on('message', this.onHeartbeatMessage);
    this.once('close', this.onHeartbeatClose);
  }

  private onHeartbeatMessage(data: any, broadcast: any) {
    if (data.type === 'PONG') {
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

  public start(intervalValue: number): void {
    if (intervalValue) { this.intervalValue = intervalValue; }

    this.ping();
  }

  public stop(): void {
    if (this.pingTimer) { clearTimeout(this.pingTimer); }
    if (this.timeout) { clearTimeout(this.timeout); }

    this.removeAllListeners('pong');
  }

}
