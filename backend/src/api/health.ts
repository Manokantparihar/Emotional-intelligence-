import { FastifyInstance } from 'fastify';

export function registerHealthRoutes(app: FastifyInstance): void {
  app.get('/health', async (request, reply) => {
    return reply.send({
      status: 'ok',
      requestId: request.id,
      timestamp: new Date().toISOString(),
    });
  });
}
