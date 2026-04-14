import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { classifyIntent } from './classifier';

describe('classifyIntent', () => {
  it('returns escalation for handoff request', () => {
    const result = classifyIntent('I need a human agent now');
    assert.equal(result.label, 'escalation');
    assert.equal(result.route, 'escalate');
  });

  it('returns lead for sales questions', () => {
    const result = classifyIntent('Can you send pricing and a demo?');
    assert.equal(result.label, 'lead');
    assert.equal(result.route, 'collect_lead');
  });

  it('returns chitchat for non-matching casual messages', () => {
    const result = classifyIntent('Hope your day is going well!');
    assert.equal(result.label, 'chitchat');
  });
});
