import { TLSSocket } from 'tls';
import { TypedEmitter } from './typed-emitter';
import { logger } from './logger';

export interface PacketStreamEvents {
  packet: (packet: any) => void;
}

export class PacketStream extends TypedEmitter<PacketStreamEvents> {

  /**
   * To whom it may concern.
   * I really don't know what was going on here in the pre ES6 / ts version.
   * There was a weird while(true) loop, that was switching between parsing
   * header (first 4 bytes) or body (header.length).
   * So get the length of the packet from the header, then parse the message itself.
   * Easy.
   * But why in a never ending loop? One would assume coz the stream doesn't end.
   * Let me elaborate: hhe loop was triggered by the streams * 'onReadable' event.
   * This according to the docs is fired whenever there is a new packet
   * on the stream that can be parsed.
   * So... if this is triggered, there is only ONE packet to be parsed.
   * Making this whole loop thing pointless.
   * So should this ever become a problem with packets not coming through.
   * This might be the issue.
   * @param stream
   */

  constructor(
    private stream: TLSSocket,
  ) {
    super();
    this.stream.on('readable', () => this.onStreamReadable());
  }

  private onStreamReadable(): void {
    const header = this.stream.read(4);
    const packetLength = PacketStream.getPacketLength(header);
    const packet = PacketStream.parseWaitingPacket(this.stream, packetLength);

    logger.debug('onStreamReadable:', { header, packetLength, packet });
    if (packet) { this.emit('packet', packet); }
  }

  private static getPacketLength(header: any): number | undefined {
    if (header === null) return;
    return header.readUInt32BE(0);
  }

  private static parseWaitingPacket(stream: TLSSocket, length?: number): any | undefined {
    return length ? stream.read(length) : undefined;
  }

  public send(buf: any): void {
    const header = Buffer.alloc(4);
    header.writeUInt32BE(buf.length, 0);
    this.stream.write(Buffer.concat([header, buf]));
  }
}
