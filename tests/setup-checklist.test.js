import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createEmptySetupChecklist,
  evaluateSetupChecklist,
  migrateLegacySetupChecklist,
  normalizeSetupChecklist,
} from '../src/setup-checklist.js';

const completeChecklist = () => ({
  mandatory: {
    htfBias: true,
    clearMss: true,
    freshFvg: true,
    impulsiveOb: true,
    structuralRr: true,
  },
  confluence: {
    liquidityTaken: true,
    premiumDiscount: true,
    dxyConfirmation: false,
    htfLevel: true,
  },
  reasons: [
    'D1 and H4 structure are bullish with higher highs and higher lows.',
    'M15 closed decisively above the last protected high.',
    '',
  ],
  state: {
    noRecoveryMode: true,
    noBoredom: true,
    independentOfLastThree: true,
  },
});

test('normalizeSetupChecklist gives old records a backward-compatible empty structure', () => {
  const normalized = normalizeSetupChecklist(undefined);
  assert.deepEqual(normalized, createEmptySetupChecklist());
  assert.equal(evaluateSetupChecklist(undefined, { rr: 4 }).assessed, false);
});

test('normalizeSetupChecklist preserves spaces while the user writes an objective reason', () => {
  const normalized = normalizeSetupChecklist({ reasons: ['D1 bias ', '', ''] });
  assert.equal(normalized.reasons[0], 'D1 bias ');
});

test('migrateLegacySetupChecklist preserves confirmed labels without treating them as new A+ evidence', () => {
  const migrated = migrateLegacySetupChecklist({ trend: true, liquidity: true, confirmation: false, rr: true });
  const result = evaluateSetupChecklist(migrated, { rr: 4 });
  assert.deepEqual(migrated.legacy, {
    confirmed: 3,
    total: 7,
    labels: ['Trend aligned', 'Liquidity taken', 'Minimum RR reached'],
  });
  assert.equal(result.isAPlus, false);
  assert.equal(result.hasLegacy, true);
  assert.equal(result.verdict, 'LEGACY CHECKLIST');
});

test('evaluateSetupChecklist marks an objective complete setup as A+ and keeps confluence optional', () => {
  const result = evaluateSetupChecklist(completeChecklist(), { rr: 3.2 });
  assert.equal(result.isAPlus, true);
  assert.equal(result.mandatoryPassed, 5);
  assert.equal(result.confluenceCount, 3);
  assert.equal(result.objectiveReasonsPassed, true);
  assert.equal(result.stateWarnings, 0);
  assert.equal(result.verdict, 'A+ READY');
});

test('evaluateSetupChecklist rejects subjective written justification', () => {
  const checklist = completeChecklist();
  checklist.reasons[1] = 'Cred că prețul probabil va continua în sus.';
  const result = evaluateSetupChecklist(checklist, { rr: 3.2 });
  assert.equal(result.isAPlus, false);
  assert.equal(result.objectiveReasonsPassed, false);
  assert.deepEqual(result.subjectiveTerms, ['cred', 'probabil']);
  assert.equal(result.verdict, 'WRITING NEEDS REVIEW');
});

test('evaluateSetupChecklist requires actual RR of at least 1:3 even when the structural RR box is checked', () => {
  const result = evaluateSetupChecklist(completeChecklist(), { rr: 2.99 });
  assert.equal(result.isAPlus, false);
  assert.equal(result.rrPassed, false);
  assert.equal(result.mandatoryPassed, 4);
  assert.equal(result.verdict, 'SETUP INCOMPLETE');
});

test('state flags require attention but never block an otherwise A+ setup', () => {
  const checklist = completeChecklist();
  checklist.state.noBoredom = false;
  checklist.state.independentOfLastThree = false;
  const result = evaluateSetupChecklist(checklist, { rr: 3 });
  assert.equal(result.isAPlus, true);
  assert.equal(result.stateWarnings, 2);
  assert.equal(result.verdict, 'A+ READY');
});
