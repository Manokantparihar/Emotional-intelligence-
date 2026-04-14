import { ChatRequest, ChatResponse } from '../../../../shared/contracts/chat';
import { ModelProvider } from '../provider';

export class MockModelProvider implements ModelProvider {
  async generateReply(request: ChatRequest): Promise<ChatResponse> {
    const lastUserMessage = [...request.history].reverse().find((turn) => turn.role === 'user');
    const name = request.config.voiceGender === 'male' ? 'Jon' : 'Joni';

    return {
      text: `${name}: I received your message${lastUserMessage ? ` — "${lastUserMessage.text}"` : ''}. Backend mock is active and ready for Phase 3.`,
      sources: [],
      meta: {
        provider: 'mock',
      },
    };
  }
}
