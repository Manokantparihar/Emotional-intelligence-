import { FastifyInstance } from 'fastify';
import { ChatRequest } from '../../../shared/contracts/chat';
import { ModelProvider } from '../ai/provider';
import { classifyEmotion } from '../orchestration/emotion/classifier';
import { mapEmpathyStyle } from '../orchestration/empathy/style-mapper';
import { classifyIntent } from '../orchestration/intent/classifier';
import { decideRoute } from '../orchestration/routing/route-decision';
import { applyPolicyGuardrails } from '../orchestration/policy/guardrails';

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
      const lastUserMessage = [...request.body.history].reverse().find((turn) => turn.role === 'user');
      const userText = lastUserMessage?.text ?? '';

      const emotion = classifyEmotion(userText);
      const empathy = mapEmpathyStyle(emotion);
      const intent = classifyIntent(userText);
      const routing = decideRoute(intent, emotion);
      const policy = applyPolicyGuardrails(routing);

      const result = await modelProvider.generateReply(request.body);

      return reply.send({
        ...result,
        text: policy.overrideText ?? result.text,
        requestId: request.id,
        meta: {
          ...result.meta,
          emotion,
          empathy,
          intent,
          routing,
          policy,
        },
      });
    },
  );
}
