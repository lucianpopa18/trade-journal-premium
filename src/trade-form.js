import { createEmptySetupChecklist } from './setup-checklist.js';

export function resetTradeFormAfterSave(previous) {
  return {
    ...previous,
    entry: '',
    sl: '',
    tp: '',
    lot: '',
    notes: '',
    screenshot: '',
    screenshotUrl: '',
    sourcePlanId: '',
    setupChecklist: createEmptySetupChecklist(),
  };
}