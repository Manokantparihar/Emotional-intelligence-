import { FastifyInstance } from 'fastify';
import { ChatRequest } from '../../../shared/contracts/chat';
import { ModelProvider } from '../ai/provider';

const chatBodySchema = {
  type: 'object',
  required: ['history', 'config'],
  additionalProperties: false,
  properties: {
    history: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'object',
        required: ['role', 'text'],
        additionalProperties: false,
        properties: {
          role: { type: 'string', enum: ['user', 'model'] },
          text: { type: 'string', minLength: 1 },
        },
      },
    },
    config: {
      type: 'object',
      required: ['emotionalIntensity', 'coolnessFactor', 'language', 'voiceGender'],
      additionalProperties: false,
      properties: {
        emotionalIntensity: { type: 'number', minimum: 0, maximum: 100 },
        coolnessFactor: { type: 'number', minimum: 0, maximum: 100 },
        language: { type: 'string', minLength: 1 },
        voiceGender: { type: 'string', enum: ['male', 'female'] },
      },
    },
  },
} as const;

export function registerChatRoutes(app: FastifyInstance, modelProvider: ModelProvider): void {
  app.post<{ Body: ChatRequest }>(
    '/api/chat',
    {
      schema: {
        body: chatBodySchema,
      },
    },
    async (request, reply) => {
      const result = await modelProvider.generateReply(request.body);
      return reply.send({ ...result, requestId: request.id });
    },
  );
}
