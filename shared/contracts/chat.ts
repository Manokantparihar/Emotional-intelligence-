export type ChatRole = 'user' | 'model';

export interface ChatTurn {
  role: ChatRole;
  text: string;
}

export interface ChatConfig {
  emotionalIntensity: number;
  coolnessFactor: number;
  language: string;
  voiceGender: 'male' | 'female';
}

export interface ChatRequest {
  history: ChatTurn[];
  config: ChatConfig;
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface ChatResponseMeta {
  emotion?: {
    label: string;
    confidence?: number;
  };
  intent?: {
    label: string;
    confidence?: number;
  };
  [key: string]: unknown;
}

export interface ChatResponse {
  text: string;
  sources?: GroundingSource[];
  requestId?: string;
  meta?: ChatResponseMeta;
}
