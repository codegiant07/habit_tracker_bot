// Application factory: sets up Fastify, plugins, health route, and modules.
import Fastify from 'fastify';
import { env } from './config/env';
import prismaPlugin from './utils/prisma';
import webhookController from './modules/whatsapp/webhook.controller';

export const buildApp = () => {
  const app = Fastify({
    logger: {
      level: env.LOG_LEVEL,
    },
  });

  app.register(prismaPlugin);

  app.get('/health', async () => ({ status: 'ok' }));

  app.register(webhookController, { prefix: '/webhook' });

  return app;
};

