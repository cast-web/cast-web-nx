import * as protobufjs from 'protobufjs';
import { Root, Type } from 'protobufjs';

// typing

const extensions = {
  CastMessage: {} as Type | undefined,
  AuthChallenge: {} as Type | undefined,
  AuthResponse: {} as Type | undefined,
  AuthError: {} as Type | undefined,
  DeviceAuthMessage: {} as Type | undefined,
};

export type Extensions = typeof extensions;
export type Messages = keyof Extensions;

// load-message-type

const onProtoBufLoad = (err: Error | null, root?: Root) => {
  if (err) throw err;

  Object.keys(extensions)
    .forEach(message => {
      extensions[message as Messages] = root?.lookupType(`extensions.api.cast_channel.${message}`);
    });
};

const getProtobufMessageExtension = (message: Messages) => {
  if (!extensions[message]) { throw new Error('extension not loaded yet'); }
  return extensions[message] as Type;
};

const getProtoBufFunctions = (message: Messages) => ({
  serialize: (data: any) => getProtobufMessageExtension(message).encode(data).finish(),
  parse: (data: any) => getProtobufMessageExtension(message).decode(data),
});

protobufjs.load(`${__dirname}/cast_channel.proto`, onProtoBufLoad);

// export interfaces

export const AuthChallenge = getProtoBufFunctions('AuthChallenge');
export const AuthError = getProtoBufFunctions('AuthError');
export const AuthResponse = getProtoBufFunctions('AuthResponse');
export const CastMessage = getProtoBufFunctions('CastMessage');
export const DeviceAuthMessage = getProtoBufFunctions('DeviceAuthMessage');
