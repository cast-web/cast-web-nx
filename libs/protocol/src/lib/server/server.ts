import * as tls from 'tls';
import { Server as TLSServer, TLSSocket } from 'tls';
import { CastMessage } from '../protocol/proto-buf';
import { PacketStream } from '../common/packet-stream';
import { TypedEmitter } from '../common/typed-emitter';
import { Client } from './client';
import { CastMessageServer, CastMessageBaseServer } from '@cast-web/types';
import { logger } from '../common/logger';

export interface ServerMessageEvents {
  error: (error: Error) => void;
  message: (message: CastMessageServer) => void;
  close: () => void;
}

export class Server extends TypedEmitter<ServerMessageEvents> {

  private readonly tlsServer: TLSServer;
  private serverClients = new Map<string, Client>();

  constructor(options: { allowHalfOpen?: boolean, pauseOnConnect?: boolean }) {
    super();

    this.tlsServer = new tls.Server(options, undefined);
  }

  private listen(port: string, host: string, callback?: () => any) {
    // const args = Array.prototype.slice.call(arguments);
    // TODO: what does private do?
    // probably removes the callback function (i guess it is optional)
    // making it an optional param should work in ES6+
    // if (typeof args[args.length - 1] === 'private') {
    //   callback = args.pop();
    // }

    this.tlsServer.listen({ port, host }, () => this.onServerListen(callback));

    // this.tlsServer.listen.apply(this.tlsServer, args.concat([onServerListen]));

    this.tlsServer.on('secureConnection', this.onServerSecureConnection);
    this.tlsServer.on('error', this.onServerError);
    this.tlsServer.once('close', this.onServerShutdown);
  }

  private onServerListen(callback?: () => any) {
    const addr = this.tlsServer.address();
    logger.debug('onServerListen', addr);
    if (callback) callback();
  }

  private onServerSecureConnection(socket: TLSSocket) {
    logger.debug('onServerSecureConnection', socket);
    const packetStream = new PacketStream(socket);
    const clientId = Server.genClientId(socket);

    const serverClient = new Client(clientId, socket, packetStream);

    serverClient.on('message', serverMessage => this.emit('message', serverMessage));

    // packetStream.on('packet', onpacket);
    // socket.once('close', ondisconnect);
    this.serverClients.set(clientId, serverClient);
  }

  private onServerShutdown() {
    logger.debug('onServerShutdown');
    this.tlsServer.removeListener('secureConnection', this.onServerSecureConnection);
    this.emit('close');
  }

  private onServerError(err: Error) {
    logger.debug('onServerError', err);
    this.emit('error', err);
  }

  public close(): void {
    this.tlsServer.close();
    this.serverClients.forEach(client => client.endSocket());
  }

  public send(baseCastMessage: CastMessageBaseServer, data: any | string): void {
    const isBuffer = Buffer.isBuffer(data);

    const message: CastMessageServer = {
      ...baseCastMessage,
      protocolVersion: 0, // CASTV2_1_0
      payloadType: isBuffer ? 1 : 0, // BINARY = 1; STRING = 0;
      payloadBinary: isBuffer ? data : undefined,
      payloadUtf8: isBuffer ? undefined : data,
    };

    logger.debug('send', message);

    // TODO: fix clientId typing
    const serverClient = this.serverClients.get(baseCastMessage.clientId || '');
    serverClient?.sendSocket(CastMessage.serialize(message));
  }

  private static genClientId(socket: TLSSocket) {
    return [socket.remoteAddress, socket.remotePort].join(':');
  }
}
