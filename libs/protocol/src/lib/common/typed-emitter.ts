import { EventEmitter } from 'events';
import TypedEventEmitter from 'typed-emitter';

// eslint-disable-next-line no-shadow
export class TypedEmitter<T> extends (EventEmitter as { new<T>(): TypedEventEmitter<T> })<T> { }
