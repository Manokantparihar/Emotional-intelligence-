import { buildApp } from './app';

async function start() {
  const { app, config } = await buildApp();

  try {
    await app.listen({ host: config.host, port: config.port });
    app.log.info(`backend listening on http://${config.host}:${config.port}`);
  } catch (error) {
    app.log.error(error, 'failed to start backend');
    process.exit(1);
  }
}

void start();
