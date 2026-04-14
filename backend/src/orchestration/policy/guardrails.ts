import { PolicyDecision, RoutingDecision } from '../../../../shared/contracts/chat';

export function applyPolicyGuardrails(decision: RoutingDecision): PolicyDecision {
  if (decision.route === 'escalate') {
    return {
      action: 'escalation_required',
      reason: decision.reason,
      overrideText:
        'I want to make sure you get the right help quickly. I am flagging this for human follow-up while I continue to assist here.',
    };
  }

  if (decision.route === 'fallback') {
    return {
      action: 'fallback',
      reason: decision.reason,
      overrideText:
        'I may be missing context. Could you share a bit more detail so I can help accurately?',
    };
  }

  return {
    action: 'normal',
    reason: decision.reason,
  };
}
