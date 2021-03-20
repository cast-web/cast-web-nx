import { Client, GenericMediaApplication } from '@cast-web/client';

console.log("Hello World!");

const run = (async () => {
  const tobiasHome = new Client();

  await tobiasHome.connect({ host: '192.168.0.84', port: 8009, rejectUnauthorized: false });

  tobiasHome.on('status', data => {
    console.log('status:', data);
    const session = data?.applications[0];
    if (session?.sessionId) {
      console.log('join session:', session);
      tobiasHome.join<GenericMediaApplication>(session, GenericMediaApplication, (error, application) => {
        console.warn('joined! :', error, application);
        application?.on('status', msg => console.error('on application message: ', msg));
        setTimeout(() => application?.getStatus((err: any, status: any) => console.log('getStatus: ', err, status)), 5000);
      })
    }
  });

  tobiasHome.on('error', (err: any) => {
    console.error('err:', err);
  });
})();
