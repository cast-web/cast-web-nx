import { TLSSocket } from 'tls';
import { TypedEmitter } from '../common/typed-emitter';
import { CastMessage } from '../protocol/proto-buf';
import { PacketStream } from '../common/packet-stream';
import { CastMessageServer } from '../protocol/google-cast';
import { logger } from '../common/logger';

export interface ServerClientMessageEvents {
  // eslint-disable-next-line no-unused-vars
  error: (error: Error) => void;
  // eslint-disable-next-line no-unused-vars,max-len
  message: (message: CastMessageServer) => void;
}

export class Client extends TypedEmitter<ServerClientMessageEvents> {

  constructor(
    private clientId: string,
    private socket: TLSSocket,
    private packetStream: PacketStream,
  ) {
    super();
  }

  public sendSocket(buffer?: Uint8Array): void {
    if (!buffer) { return; }
    this.socket.end(buffer);
  }

  public endSocket(): void {
    this.socket.end();
  }

  private onPacketStreamPacket(buf: any): void {
    const protoBufMessage = CastMessage.parse(buf) as any;

    if (protoBufMessage?.protocolVersion !== 0) { // CASTV2_1_0
      logger.debug('onPacketStreamPacket', protoBufMessage);
      this.socket.end();
      return;
    }

    const message: CastMessageServer = {
      // TODO: type this
      ...protoBufMessage as unknown as CastMessageServer,
    };

    logger.debug('onPacketStreamPacket', message);
    this.emit('message', message);
  }

  private onPacketSteamDisconnect(): void {
    logger.debug('onPacketSteamDisconnect', this.clientId);
    this.packetStream.removeListener('packet', this.onPacketStreamPacket);
    // TODO:
    // delete this.clients[clientId];
  }
}
