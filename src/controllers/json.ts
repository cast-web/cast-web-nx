import { Client } from 'cast-protocol/lib/client/client';
import { Controller } from './controller';

// is this really just here to hardcode the 'JSON' param?
export class JsonController extends Controller {

  constructor(client: Client, sourceId: string, destinationId: string, namespace: string) {
    super(client, sourceId, destinationId, namespace, 'JSON');
  }

}
