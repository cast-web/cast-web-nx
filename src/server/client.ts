import { TLSSocket } from 'tls';
// import * as debug from 'debug';
import { TypedEmitter } from '../common/typed-emitter';
import { CastMessage } from '../protocol/proto-buf';
import { PacketStream } from '../common/packet-stream';
import { CastMessageServer } from '../protocol/google-cast';

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
      // eslint-disable-next-line max-len
      // debug('client error: clientId=%s unsupported protocol version (%s)', clientId, message.protocolVersion);
      this.socket.end();
      return;
    }

    const message: CastMessageServer = {
      // TODO: type this
      ...protoBufMessage as unknown as CastMessageServer,
    };

    // debug(
    // eslint-disable-next-line max-len
    //   'recv message: clientId=%s protocolVersion=%s sourceId=%s destinationId=%s namespace=%s data=%s',
    //   clientId,
    //   message.protocolVersion,
    //   message.sourceId,
    //   message.destinationId,
    //   message.namespace,
    //   (message.payloadType === 1) // BINARY
    //     ? util.inspect(message.payloadBinary)
    //     : message.payloadUtf8,
    // );

    this.emit('message', message);
  }

  private onPacketSteamDisconnect(): void {
    // debug('client %s disconnected', clientId);
    this.packetStream.removeListener('packet', this.onPacketStreamPacket);
    // TODO:
    // delete this.clients[clientId];
  }
}
