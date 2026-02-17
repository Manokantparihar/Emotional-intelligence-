
export type Role = 'user' | 'model';

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface Message {
  id: string;
  role: Role;
  text: string;
  timestamp: Date;
  isSpeaking?: boolean;
  imageUrl?: string; // For in-chat generated images
  sources?: GroundingSource[]; // For Google Search citations
}

export interface JonConfig {
  emotionalIntensity: number; // 0 to 100
  coolnessFactor: number; // 0 to 100
  isSpeechEnabled: boolean;
  language: string;
  voiceGender: 'male' | 'female';
  volume: number; // 0 to 100
  avatarUrl?: string;
}

export interface ChatState {
  messages: Message[];
  isTyping: boolean;
  error: string | null;
  config: JonConfig;
  isSettingsOpen: boolean;
  isLiveMode: boolean;
}
