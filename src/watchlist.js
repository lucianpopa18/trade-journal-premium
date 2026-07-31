import { migrateLegacySetupChecklist, normalizeSetupChecklist } from './setup-checklist.js';

export const WATCHLIST_ACTIVE_STATUSES = ['Watching', 'Ready'];
export const WATCHLIST_CLOSED_STATUSES = ['Executed', 'Skipped', 'Invalidated', 'Expired'];

const numberOrBlank = value => value === '' || value === null || value === undefined ? '' : Number(value);

export function normalizeWatchPlanChecklist(plan) {
  if (plan?.setupChecklist) return normalizeSetupChecklist(plan.setupChecklist);
  if (plan?.checklist && typeof plan.checklist === 'object') return migrateLegacySetupChecklist(plan.checklist);
  return normalizeSetupChecklist(undefined);
}

export function calculatePlannedRR({ entryFrom, entryTo, sl, tp }) {
  const from = Number(entryFrom);
  const to = entryTo === '' || entryTo === null || entryTo === undefined ? from : Number(entryTo);
  const stop = Number(sl);
  const target = Number(tp);
  if (![from, to, stop, target].every(Number.isFinite)) return 0;
  const midpoint = (from + to) / 2;
  const risk = Math.abs(midpoint - stop);
  if (!risk) return 0;
  const rr = Math.abs(target - midpoint) / risk;
  return Number.isFinite(rr) ? Number(rr.toFixed(2)) : 0;
}

export function createWatchPlan(input, id, createdAt = new Date().toISOString()) {
  const entryFrom = numberOrBlank(input.entryFrom);
  const entryTo = numberOrBlank(input.entryTo) === '' ? entryFrom : numberOrBlank(input.entryTo);
  const plan = {
    id,
    createdAt,
    updatedAt: createdAt,
    status: input.status || 'Watching',
    symbol: String(input.symbol || 'XAUUSD').trim().toUpperCase(),
    direction: input.direction || 'Long',
    timeframe: input.timeframe || 'M15',
    session: input.session || 'London',
    setup: input.setup || 'Breaker + FVG',
    entryFrom,
    entryTo,
    sl: numberOrBlank(input.sl),
    tp: numberOrBlank(input.tp),
    risk: numberOrBlank(input.risk) === '' ? 1 : numberOrBlank(input.risk),
    confidence: Number(input.confidence || 7),
    confirmation: String(input.confirmation || '').trim(),
    invalidation: String(input.invalidation || '').trim(),
    expiresAt: input.expiresAt || '',
    screenshot: input.screenshot || '',
    screenshotUrl: input.screenshotUrl || '',
    notes: String(input.notes || '').trim(),
    setupChecklist: normalizeWatchPlanChecklist(input),
  };
  return { ...plan, rr: calculatePlannedRR(plan) };
}

export function isPlanExpired(plan, now = new Date()) {
  if (!WATCHLIST_ACTIVE_STATUSES.includes(plan.status) || !plan.expiresAt) return false;
  const deadline = new Date(plan.expiresAt);
  return !Number.isNaN(deadline.getTime()) && deadline.getTime() < now.getTime();
}

export function prepareTradeFromPlan(plan, date) {
  const from = Number(plan.entryFrom);
  const to = plan.entryTo === '' || plan.entryTo === null || plan.entryTo === undefined ? from : Number(plan.entryTo);
  const entry = Number.isFinite(from) && Number.isFinite(to) ? Number(((from + to) / 2).toFixed(5)) : '';
  const zone = plan.entryFrom === plan.entryTo || plan.entryTo === '' ? `${plan.entryFrom}` : `${plan.entryFrom}–${plan.entryTo}`;
  const trace = `Planned entry zone: ${zone} · Planned RR: ${Number(plan.rr || 0).toFixed(2)}R`;
  return {
    date,
    symbol: plan.symbol,
    direction: plan.direction,
    session: plan.session,
    entry,
    sl: plan.sl,
    tp: plan.tp,
    risk: plan.risk,
    lot: '',
    emotion: 'Calm',
    setup: plan.setup,
    confidence: plan.confidence,
    notes: [plan.notes, trace].filter(Boolean).join('\n\n'),
    screenshot: plan.screenshot || '',
    screenshotUrl: plan.screenshotUrl || '',
    setupChecklist: normalizeWatchPlanChecklist(plan),
    sourcePlanId: plan.id,
  };
}

function isSameLocalDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function summarizeWatchlist(plans, now = new Date()) {
  const active = plans.filter(plan => WATCHLIST_ACTIVE_STATUSES.includes(plan.status)).length;
  const ready = plans.filter(plan => plan.status === 'Ready').length;
  const expiringToday = plans.filter(plan => {
    if (!WATCHLIST_ACTIVE_STATUSES.includes(plan.status) || !plan.expiresAt) return false;
    const deadline = new Date(plan.expiresAt);
    return !Number.isNaN(deadline.getTime()) && isSameLocalDay(deadline, now);
  }).length;
  const executed = plans.filter(plan => plan.status === 'Executed').length;
  const closed = plans.filter(plan => WATCHLIST_CLOSED_STATUSES.includes(plan.status)).length;
  return { active, ready, expiringToday, executed, closed, conversionRate: closed ? Math.round(executed / closed * 100) : 0 };
}
