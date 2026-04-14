import { ChatRequest, ChatResponse } from '../../../shared/contracts/chat';

export interface ModelProvider {
  generateReply(request: ChatRequest): Promise<ChatResponse>;
}
