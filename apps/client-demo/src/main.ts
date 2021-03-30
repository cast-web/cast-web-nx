import { Client, GenericMediaApplication } from '@cast-web/client';
import { Namespaces } from '@cast-web/types';

console.log("Hello World!");

const run = (async () => {
  const myChromecast = new Client();

  await myChromecast.connect({ host: '192.168.0.84', port: 8009, rejectUnauthorized: false });

  myChromecast.on('status', async data => {
    console.log('status:', data);
    const session = (data?.applications || [])[0];

    const test = Namespaces

    if (session?.sessionId) {
      console.log('join session:', session);
      const genericMediaApplication = await myChromecast.join<GenericMediaApplication>(session, GenericMediaApplication);
      console.warn('joined! :', genericMediaApplication);
      genericMediaApplication?.on('status', msg => console.error('on genericMediaApplication message: ', msg));
      genericMediaApplication?.on('applicationClose', () => console.error('on genericMediaApplication applicationClose: '));
      genericMediaApplication?.on('error', msg => console.error('on genericMediaApplication error: ', msg));
      // setTimeout(() => genericMediaApplication.pause(), 5000);
      // setTimeout(() => genericMediaApplication.play(), 10000);
      // setTimeout(() => genericMediaApplication.stop(), 15000);
      // setTimeout(() => genericMediaApplication.close(), 20000);
      setTimeout(async () => myChromecast.stop(genericMediaApplication), 20000);
    }
  });


  myChromecast.on('error', (err: any) => {
    console.error('err:', err);
  });
})();
