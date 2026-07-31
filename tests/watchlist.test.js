import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculatePlannedRR,
  createWatchPlan,
  isPlanExpired,
  prepareTradeFromPlan,
  summarizeWatchlist,
} from '../src/watchlist.js';
import { createEmptySetupChecklist } from '../src/setup-checklist.js';

test('calculatePlannedRR uses the midpoint of an entry zone', () => {
  assert.equal(calculatePlannedRR({ entryFrom: 3335, entryTo: 3337, sl: 3328, tp: 3352 }), 2);
});

test('createWatchPlan normalizes a new plan with safe defaults', () => {
  const plan = createWatchPlan({ symbol: ' eurusd ', direction: 'Short', entryFrom: '1.09', entryTo: '', sl: '1.095', tp: '1.08' }, 'plan-1', '2026-07-31T12:00:00.000Z');
  assert.equal(plan.id, 'plan-1');
  assert.equal(plan.symbol, 'EURUSD');
  assert.equal(plan.status, 'Watching');
  assert.equal(plan.entryFrom, 1.09);
  assert.equal(plan.entryTo, 1.09);
  assert.equal(plan.rr, 2);
  assert.deepEqual(plan.setupChecklist, createEmptySetupChecklist());
});

test('createWatchPlan migrates the old seven-item checklist without claiming new A+ evidence', () => {
  const plan = createWatchPlan({ entryFrom: 100, sl: 95, tp: 115, checklist: { trend: true, liquidity: true, rr: true } }, 'legacy-plan');
  assert.deepEqual(plan.setupChecklist.legacy, {
    confirmed: 3,
    total: 7,
    labels: ['Trend aligned', 'Liquidity taken', 'Minimum RR reached'],
  });
  assert.equal(plan.setupChecklist.mandatory.htfBias, false);
});

test('isPlanExpired only expires active plans after their deadline', () => {
  const active = { status: 'Watching', expiresAt: '2026-08-01T09:00:00.000Z' };
  assert.equal(isPlanExpired(active, new Date('2026-08-01T10:00:00.000Z')), true);
  assert.equal(isPlanExpired({ ...active, status: 'Executed' }, new Date('2026-08-01T10:00:00.000Z')), false);
  assert.equal(isPlanExpired({ ...active, expiresAt: '' }, new Date('2026-08-01T10:00:00.000Z')), false);
});

test('prepareTradeFromPlan prefills the journal and keeps plan traceability', () => {
  const setupChecklist = createEmptySetupChecklist();
  setupChecklist.mandatory.htfBias = true;
  const trade = prepareTradeFromPlan({
    id: 'plan-7', symbol: 'XAUUSD', direction: 'Long', session: 'London', setup: 'Breaker + FVG',
    entryFrom: 3335, entryTo: 3337, sl: 3328, tp: 3352, risk: 1, confidence: 8,
    screenshot: 'data:image/jpeg;base64,abc', screenshotUrl: '', notes: 'Wait for displacement', rr: 2, setupChecklist,
  }, '2026-07-31');
  assert.equal(trade.symbol, 'XAUUSD');
  assert.equal(trade.entry, 3336);
  assert.equal(trade.sourcePlanId, 'plan-7');
  assert.deepEqual(trade.setupChecklist, setupChecklist);
  assert.match(trade.notes, /Wait for displacement/);
  assert.match(trade.notes, /Planned entry zone: 3335–3337/);
});

test('summarizeWatchlist reports active, ready, expiring and conversion counts', () => {
  const plans = [
    { status: 'Watching', expiresAt: '2026-08-01T18:00:00.000Z' },
    { status: 'Ready', expiresAt: '' },
    { status: 'Executed', expiresAt: '' },
    { status: 'Skipped', expiresAt: '' },
  ];
  assert.deepEqual(summarizeWatchlist(plans, new Date('2026-08-01T10:00:00.000Z')), {
    active: 2,
    ready: 1,
    expiringToday: 1,
    executed: 1,
    closed: 2,
    conversionRate: 50,
  });
});
