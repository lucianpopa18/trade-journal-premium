import test from 'node:test';
import assert from 'node:assert/strict';
import { resetTradeFormAfterSave } from '../src/trade-form.js';

test('resetTradeFormAfterSave preserves the freshest concurrent form context and clears entry data', () => {
  const latest = {
    symbol: 'LATEST', direction: 'Short', entry: '100', sl: '105', tp: '90', lot: '2',
    notes: 'newer state', screenshot: 'image', screenshotUrl: 'https://example.com', sourcePlanId: 'plan-1',
    setupChecklist: { mandatory: { htfBias: true } },
  };
  const reset = resetTradeFormAfterSave(latest);
  assert.equal(reset.symbol, 'LATEST');
  assert.equal(reset.direction, 'Short');
  assert.equal(reset.entry, '');
  assert.equal(reset.sourcePlanId, '');
  assert.equal(reset.setupChecklist.mandatory.htfBias, false);
});
