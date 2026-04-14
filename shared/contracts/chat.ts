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

export type EmotionLabel = 'calm' | 'anxious' | 'frustrated' | 'sad' | 'angry' | 'positive' | 'confused';

export interface EmotionAnalysis {
  label: EmotionLabel;
  confidence: number;
  escalationRisk: number;
  rationale?: string;
}

export type EmpathyStyle =
  | 'steady_reassurance'
  | 'deescalation_support'
  | 'warm_validation'
  | 'encouraging_positive'
  | 'clear_guidance';

export type IntentLabel = 'faq' | 'support' | 'lead' | 'escalation' | 'chitchat';

export interface IntentAnalysis {
  label: IntentLabel;
  confidence: number;
  route: 'answer' | 'collect_lead' | 'escalate' | 'fallback';
  rationale?: string;
}

export interface RoutingDecision {
  route: 'answer' | 'collect_lead' | 'escalate' | 'fallback';
  reason: string;
}

export interface PolicyDecision {
  action: 'normal' | 'fallback' | 'escalation_required';
  reason: string;
  overrideText?: string;
}

export interface ChatResponseMeta {
  emotion?: EmotionAnalysis;
  empathy?: {
    style: EmpathyStyle;
    guidance: string;
  };
  intent?: IntentAnalysis;
  routing?: RoutingDecision;
  policy?: PolicyDecision;
  [key: string]: unknown;
}

export interface ChatResponse {
  text: string;
  sources?: GroundingSource[];
  requestId?: string;
  meta?: ChatResponseMeta;
}
