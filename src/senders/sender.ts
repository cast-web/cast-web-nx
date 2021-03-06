import { Client } from 'cast-protocol/lib/client/client';
import { TypedEmitter } from '../common/typed-emitter';

export class Sender extends TypedEmitter<any> {

  constructor(
    protected client: Client | undefined,
    private senderId: string | undefined,
    private receiverId: string | undefined,
  ) {
    super();

    this.client = client;
    this.senderId = senderId;
    this.receiverId = receiverId;
  }

  public close(): void {
    this.senderId = undefined;
    this.receiverId = undefined;
    this.client = undefined;
  }

  // TODO: tf? fix this?
  protected createController() {
    // eslint-disable-next-line prefer-rest-params
    const args = Array.prototype.slice.call(arguments);
    const Controller = args.shift();
    return this.construct(Controller, [this.client, this.senderId, this.receiverId].concat(args));
  }

  // tf?
  private construct(contructor: any, args: any) {
    const fn: any = () => contructor.apply(this, args);
    fn.prototype = contructor.prototype;
    // eslint-disable-next-line new-cap
    return new fn();
  }
}

module.exports = Sender;
