// CONTROLLERS
import { BaseController } from './controllers/base';
import { ConnectionController } from './controllers/connection';
import { HeartbeatController } from './controllers/heartbeat';
import { MediaController } from './controllers/media';
import { ReceiverController } from './controllers/receiver';
import { RequestResponseController } from './controllers/request-response';

// SENDERS
import { Application } from './senders/application';
import { DefaultMediaReceiver } from './senders/default-media-receiver';
import { PlatformSender } from './senders/platform';
import { Sender } from './senders/sender';
import { GenericMediaApplication } from './senders/generic-media-application';

export = {
  Client: PlatformSender,
  Controllers: {
    BaseController,
    ConnectionController,
    HeartbeatController,
    MediaController,
    ReceiverController,
    RequestResponseController,
  },
  Senders: {
    Application,
    DefaultMediaReceiver,
    GenericMediaApplication,
    PlatformSender,
    Sender,
  },
}
