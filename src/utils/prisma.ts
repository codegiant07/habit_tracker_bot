// Fastify plugin that wires a singleton PrismaClient onto the app instance.
import fp from 'fastify-plugin';
import { PrismaClient } from '@prisma/client';
import { env } from '../config/env';

const prisma = new PrismaClient({
  log: env.LOG_LEVEL === 'debug' ? ['query', 'info', 'warn', 'error'] : ['warn', 'error'],
});

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}

export default fp(async (fastify) => {
  fastify.decorate('prisma', prisma);

  fastify.addHook('onClose', async (app) => {
    await app.prisma.$disconnect();
  });
});

