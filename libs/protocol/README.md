# protocol

###### An implementation of the Google Cast Protocol V2

![npm](https://img.shields.io/npm/dm/@cast-web/protocol?style=flat-square)
[![PRs](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)]()
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg?style=flat-square)](https://github.com/semantic-release/semantic-release)

This is a fork of [node-castv2](https://github.com/thibauts/node-castv2 "node-castv2") that aims to improve on the following:

- ✅ TS typing
- ✅ promise based API (where it makes sense)
- ✅ unified code styling
- ✅ full ES6 syntax
- ⏳ unit testing
- ✅ tsdoc
- ✨ and more to come!

The module provides both a `Client` and a `Server` implementation of the low-level protocol. The server is (sadly) pretty useless because device authentication gets in the way for now (and maybe for good).
The client still allows you to connect and exchange messages with a Chromecast dongle without any restriction.

The `Client` is untested and probably doesn't work. I don't see the point in refactoring it.

## Installation

```
$ yarn add @cast-web/protocol
```

## Usage

See the [ts-docs](https://cast-web.github.io/cast-web-nx/protocol/). It includes examples

## Example
```ts
import { Client } from '@cast-web/protocol';
import {
  ConnectionChannel,
  HeartbeatChannel,
  ReceiverChannel,
  Namespaces,
} from '@cast-web/types';

const client = new Client();
// wait for the client to connect
await client.connect({ host: '192.168.1.101' });

// create channels
const connection = client.createChannel<ConnectionChannel>('sender-0', 'receiver-0', Namespaces.Connection, 'JSON');
const heartbeat = client.createChannel<HeartbeatChannel>('sender-0', 'receiver-0', Namespaces.Heartbeat, 'JSON');
const receiver = client.createChannel<ReceiverChannel>('sender-0', 'receiver-0', Namespaces.Receiver, 'JSON');

// define event callbacks
receiver.on('message', message => console.log('receiver message:', message));

// connect to the receiver
connection.send({ type: 'CONNECT' });

// start the heartbeat
setInterval(() => heartbeat.send({ type: 'PING' }), 5000);
```

## Debugging

// TODO: add winston configuration

## Cast protocol description

An attempt can be found [here](./protocol.md).

## Contributors

* [thibauts](https://github.com/thibauts) (Thibaut Séguy)
