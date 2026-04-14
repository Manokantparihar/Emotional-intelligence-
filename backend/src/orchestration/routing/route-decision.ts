import { EmotionAnalysis, IntentAnalysis, RoutingDecision } from '../../../../shared/contracts/chat';

export function decideRoute(intent: IntentAnalysis, emotion: EmotionAnalysis): RoutingDecision {
  if (intent.label === 'escalation') {
    return { route: 'escalate', reason: 'explicit escalation intent' };
  }

  if (emotion.escalationRisk >= 0.75) {
    return { route: 'escalate', reason: 'high emotional escalation risk' };
  }

  if (intent.confidence < 0.55) {
    return { route: 'fallback', reason: 'low intent confidence' };
  }

  return { route: intent.route, reason: 'intent route accepted' };
}
