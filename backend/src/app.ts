import { randomUUID } from 'node:crypto';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { getConfig } from './config/env';
import { MockModelProvider } from './ai/providers/mock-model-provider';
import { registerChatRoutes } from './api/chat';
import { registerHealthRoutes } from './api/health';

export async function buildApp() {
  const config = getConfig();

  const app = Fastify({
    logger: { level: process.env.LOG_LEVEL || 'info' },
    genReqId: (request) => {
      const providedId = request.headers['x-request-id'];
      if (typeof providedId === 'string' && providedId.trim().length > 0) {
        return providedId;
      }
      return randomUUID();
    },
    requestIdHeader: 'x-request-id',
  });

  await app.register(cors, {
    origin: config.corsOrigin,
  });

  app.addHook('onRequest', async (request) => {
    request.log.info({ requestId: request.id, method: request.method, url: request.url }, 'incoming request');
  });

  app.addHook('onSend', async (request, reply, payload) => {
    reply.header('x-request-id', request.id);
    return payload;
  });

  registerHealthRoutes(app);
  registerChatRoutes(app, new MockModelProvider());

  return { app, config };
}
