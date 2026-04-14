import { EmotionAnalysis, EmotionLabel } from '../../../../shared/contracts/chat';

interface EmotionRule {
  label: EmotionLabel;
  terms: string[];
  confidence: number;
  rationale: string;
}

const EMOTION_RULES: EmotionRule[] = [
  {
    label: 'angry',
    terms: ['angry', 'furious', 'unacceptable', 'terrible', 'outraged', 'hate this'],
    confidence: 0.9,
    rationale: 'high-intensity negative language',
  },
  {
    label: 'frustrated',
    terms: ['frustrated', 'annoyed', 'still not working', 'stuck', 'again'],
    confidence: 0.82,
    rationale: 'friction and repeated failure cues',
  },
  {
    label: 'anxious',
    terms: ['anxious', 'worried', 'nervous', 'stressed', 'panic', 'overwhelmed'],
    confidence: 0.82,
    rationale: 'anxiety or stress language',
  },
  {
    label: 'sad',
    terms: ['sad', 'down', 'upset', 'hurt', 'hopeless'],
    confidence: 0.8,
    rationale: 'low mood cues',
  },
  {
    label: 'confused',
    terms: ['confused', "don't understand", 'not sure', 'unclear', 'what do you mean'],
    confidence: 0.76,
    rationale: 'clarification and uncertainty cues',
  },
  {
    label: 'positive',
    terms: ['great', 'awesome', 'perfect', 'thank you', 'thanks', 'love this'],
    confidence: 0.78,
    rationale: 'positive sentiment cues',
  },
];

function normalize(text: string): string {
  return text.trim().toLowerCase();
}

function scoreEscalationRisk(label: EmotionLabel, text: string): number {
  const urgencyTerms = ['urgent', 'asap', 'immediately', 'right now', 'cancel', 'refund'];
  const hasUrgencyCue = urgencyTerms.some((term) => text.includes(term));

  const base: Record<EmotionLabel, number> = {
    calm: 0.08,
    positive: 0.06,
    confused: 0.25,
    frustrated: 0.45,
    anxious: 0.55,
    sad: 0.5,
    angry: 0.72,
  };

  const risk = hasUrgencyCue ? base[label] + 0.12 : base[label];
  return Math.max(0, Math.min(1, Number(risk.toFixed(2))));
}

export function classifyEmotion(userText: string): EmotionAnalysis {
  const text = normalize(userText);

  if (!text) {
    return {
      label: 'calm',
      confidence: 0.55,
      escalationRisk: 0.08,
      rationale: 'empty user message defaults to calm',
    };
  }

  for (const rule of EMOTION_RULES) {
    if (rule.terms.some((term) => text.includes(term))) {
      return {
        label: rule.label,
        confidence: rule.confidence,
        escalationRisk: scoreEscalationRisk(rule.label, text),
        rationale: rule.rationale,
      };
    }
  }

  return {
    label: 'calm',
    confidence: 0.62,
    escalationRisk: scoreEscalationRisk('calm', text),
    rationale: 'no strong emotional cues detected',
  };
}
