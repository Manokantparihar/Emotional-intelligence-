import { IntentAnalysis, IntentLabel } from '../../../../shared/contracts/chat';

interface IntentRule {
  label: IntentLabel;
  terms: string[];
  confidence: number;
  rationale: string;
}

const INTENT_RULES: IntentRule[] = [
  {
    label: 'escalation',
    terms: ['human agent', 'manager', 'supervisor', 'escalate', 'formal complaint'],
    confidence: 0.9,
    rationale: 'explicit handoff request',
  },
  {
    label: 'lead',
    terms: ['pricing', 'quote', 'demo', 'buy', 'purchase', 'sales', 'plan details'],
    confidence: 0.84,
    rationale: 'commercial interest cues',
  },
  {
    label: 'support',
    terms: ['not working', 'error', 'issue', 'problem', 'broken', 'cannot', "can't"],
    confidence: 0.82,
    rationale: 'troubleshooting/support cues',
  },
  {
    label: 'faq',
    terms: ['what is', 'how does', 'where can i', 'hours', 'policy', 'documentation'],
    confidence: 0.78,
    rationale: 'informational/faq phrasing',
  },
];

const ROUTE_BY_INTENT: Record<IntentLabel, IntentAnalysis['route']> = {
  faq: 'answer',
  support: 'answer',
  lead: 'collect_lead',
  escalation: 'escalate',
  chitchat: 'answer',
};

function normalize(text: string): string {
  return text.trim().toLowerCase();
}

export function classifyIntent(userText: string): IntentAnalysis {
  const text = normalize(userText);

  if (!text) {
    return {
      label: 'chitchat',
      confidence: 0.4,
      route: 'fallback',
      rationale: 'empty message',
    };
  }

  for (const rule of INTENT_RULES) {
    if (rule.terms.some((term) => text.includes(term))) {
      return {
        label: rule.label,
        confidence: rule.confidence,
        route: ROUTE_BY_INTENT[rule.label],
        rationale: rule.rationale,
      };
    }
  }

  const looksQuestionLike = text.includes('?') || text.startsWith('can you') || text.startsWith('could you');
  if (looksQuestionLike) {
    return {
      label: 'faq',
      confidence: 0.56,
      route: 'answer',
      rationale: 'question-form fallback',
    };
  }

  return {
    label: 'chitchat',
    confidence: 0.52,
    route: 'answer',
    rationale: 'no specific intent match',
  };
}
