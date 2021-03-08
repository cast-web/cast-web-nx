import { TLSSocket } from 'tls';
import { TypedEmitter } from './typed-emitter';

export interface PacketStreamEvents {
  packet: (packet: any) => void;
}

export class PacketStream extends TypedEmitter<PacketStreamEvents> {
  private WAITING_HEADER = 0;
  private WAITING_PACKET = 1;
  private state = this.WAITING_HEADER;
  private packetLength = 0;

  constructor(
    private stream: TLSSocket,
  ) {
    super();
    this.stream.on('readable', () => this.onStreamReadable());
  }

  private onStreamReadable(): void {
    // TODO: tf?
    while (true) {
      // TODO: default case
      // eslint-disable-next-line default-case
      switch (this.state) {
        case this.WAITING_HEADER:
          // eslint-disable-next-line no-case-declarations
          const header = this.stream.read(4);
          if (header === null) return;
          this.packetLength = header.readUInt32BE(0);
          this.state = this.WAITING_PACKET;
          break;
        case this.WAITING_PACKET:
          // logger.warn('not waiting, stream:', this.stream);
          // eslint-disable-next-line no-case-declarations
          const packet = this.stream.read(this.packetLength);
          if (packet === null) return;
          this.emit('packet', packet);
          this.state = this.WAITING_HEADER;
          break;
      }
    }
  }

  public send(buf: any): void {
    // TODO: remove new Buffer
    // eslint-disable-next-line no-buffer-constructor
    const header = new Buffer(4);
    header.writeUInt32BE(buf.length, 0);
    this.stream.write(Buffer.concat([header, buf]));
  }
}
