import { Client } from 'cast-protocol/lib/client/client';
import { Channel, ChannelEncoding } from 'cast-protocol/lib/client/channel';
import { TypedEmitter } from '../common/typed-emitter';

export interface ControllerEvents {
  // TODO: type this
  // TODO: this is really broken, requestId/callback only required in ./request-response
  message: (message: any, broadcast: any, requestId?: number, callback?: (...args: any) => any) => void;
  close: () => void;
  disconnect: () => void;
  pong: () => void;
  timeout: () => void;
  // TODO: type this
  status: (status: any) => void;
}

export class Controller extends TypedEmitter<ControllerEvents> {

  private channel: Channel;

  // TODO: better typing in cast-protocol lib
  constructor(client: Client, sourceId: string, destinationId: string, namespace: string, encoding: ChannelEncoding) {
    super();

    this.channel = client.createChannel(sourceId, destinationId, namespace, encoding);

    this.channel.on('message', this.onControllerMessage);
    this.channel.once('close', this.onControllerClose);

  }

  private onControllerMessage(data: any, broadcast: any): void {
    this.emit('message', data, broadcast);
  }

  private onControllerClose(): void {
    this.channel.removeListener('message', this.onControllerMessage);
    this.emit('close');
  }

  // TODO: type this
  protected send(data: any): void {
    this.channel.send(data);
  }

  public close(): void {
    this.channel.close();
  }
}
