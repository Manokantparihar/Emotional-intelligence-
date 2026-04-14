import { EmotionAnalysis, EmpathyStyle } from '../../../../shared/contracts/chat';

export interface EmpathyStyleResult {
  style: EmpathyStyle;
  guidance: string;
}

export function mapEmpathyStyle(emotion: EmotionAnalysis): EmpathyStyleResult {
  switch (emotion.label) {
    case 'angry':
    case 'frustrated':
      return {
        style: 'deescalation_support',
        guidance: 'Acknowledge frustration, stay calm, and offer concrete next steps.',
      };
    case 'anxious':
    case 'sad':
      return {
        style: 'warm_validation',
        guidance: 'Validate feelings and provide gentle reassurance with clear wording.',
      };
    case 'confused':
      return {
        style: 'clear_guidance',
        guidance: 'Use concise instructions and verify understanding.',
      };
    case 'positive':
      return {
        style: 'encouraging_positive',
        guidance: 'Mirror positive tone and reinforce progress.',
      };
    case 'calm':
    default:
      return {
        style: 'steady_reassurance',
        guidance: 'Keep the tone balanced, supportive, and practical.',
      };
  }
}
