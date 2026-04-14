import { ChatRequest, ChatResponse } from '../shared/contracts/chat';

const CHAT_ENDPOINT = '/api/chat';

function createRequestId(): string {
  return typeof crypto?.randomUUID === 'function'
    ? crypto.randomUUID()
    : `req-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export async function requestChatCompletion(payload: ChatRequest): Promise<ChatResponse> {
  const requestId = createRequestId();

  const response = await fetch(CHAT_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-request-id': requestId,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Chat request failed with status ${response.status}`);
  }

  const result = (await response.json()) as ChatResponse;
  return { ...result, requestId: result.requestId || requestId };
}
