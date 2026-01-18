/// <reference path="./types/global.d.ts" />
// Entrypoint: builds the app and starts the HTTP server with env config.
import { buildApp } from './app';
import { env } from './config/env';
import { registerReminderJobs } from './jobs/reminder.job';

const start = async () => {
  const app = buildApp();

  try {
    await app.listen({ port: Number(env.PORT), host: env.HOST });
    app.log.info(`Server listening on http://${env.HOST}:${env.PORT}`);
    registerReminderJobs(app);
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
};

void start();

