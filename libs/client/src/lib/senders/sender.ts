import { Client } from '@cast-web/protocol';
import { TypedEmitter } from '../common/typed-emitter';

/**
 * @category Base
 */
export class Sender<CustomMessages> extends TypedEmitter<CustomMessages> {

  constructor(
    protected client: Client | undefined,
    protected senderId: string | undefined,
    protected receiverId: string | undefined,
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

  // // TODO: tf? fix this?
  // protected createController() {
  //   // eslint-disable-next-line prefer-rest-params
  //   const args = Array.prototype.slice.call(arguments);
  //   const Controller = args.shift();
  // eslint-disable-next-line max-len
  //   return this.construct(Controller, [this.client, this.senderId, this.receiverId].concat(args));
  // }
  //
  // // tf?
  // private construct(contructor: any, args: any) {
  //   const fn: any = () => contructor.apply(this, args);
  //   fn.prototype = contructor.prototype;
  //   // eslint-disable-next-line new-cap
  //   return new fn();
  // }
}
