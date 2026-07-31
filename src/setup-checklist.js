export const A_PLUS_MANDATORY_ITEMS = [
  ['htfBias', 'D / H4 bias confirms the trade direction'],
  ['clearMss', 'Clear MSS on the entry timeframe — decisive, not marginal'],
  ['freshFvg', 'FVG is fresh and has not been partially filled'],
  ['impulsiveOb', 'Order block comes from an impulsive move'],
  ['structuralRr', 'SL is at true structural invalidation and RR is at least 1:3'],
];

export const A_PLUS_CONFLUENCE_ITEMS = [
  ['liquidityTaken', 'Liquidity taken first — identifiable stop hunt / inducement'],
  ['premiumDiscount', 'Zone aligns with HTF premium / discount'],
  ['dxyConfirmation', 'DXY confirms the direction'],
  ['htfLevel', 'Zone aligns with a relevant HTF level'],
];

export const A_PLUS_STATE_ITEMS = [
  ['noRecoveryMode', 'I am not trying to recover after losses or breakevens'],
  ['noBoredom', 'I am not forcing this trade from boredom or impatience'],
  ['independentOfLastThree', 'I would take this setup regardless of the last 3 results'],
];

export const SUBJECTIVE_SETUP_TERMS = ['simt', 'cred', 'probabil', 'sper', 'pare'];

const LEGACY_CHECKLIST_ITEMS = [
  ['trend', 'Trend aligned'],
  ['liquidity', 'Liquidity taken'],
  ['confirmation', 'Entry confirmation'],
  ['news', 'No high-impact news'],
  ['risk', 'Risk within limit'],
  ['session', 'Session valid'],
  ['rr', 'Minimum RR reached'],
];

const objectWithKeys = (source, items) => Object.fromEntries(items.map(([key]) => [key, source?.[key] === true]));

export function createEmptySetupChecklist() {
  return {
    mandatory: objectWithKeys({}, A_PLUS_MANDATORY_ITEMS),
    confluence: objectWithKeys({}, A_PLUS_CONFLUENCE_ITEMS),
    reasons: ['', '', ''],
    state: objectWithKeys({}, A_PLUS_STATE_ITEMS),
    legacy: null,
  };
}

export function migrateLegacySetupChecklist(legacyChecklist) {
  const checklist = createEmptySetupChecklist();
  if (!legacyChecklist || typeof legacyChecklist !== 'object') return checklist;
  const labels = LEGACY_CHECKLIST_ITEMS.filter(([key]) => legacyChecklist[key] === true).map(([, label]) => label);
  return {
    ...checklist,
    legacy: { confirmed: labels.length, total: LEGACY_CHECKLIST_ITEMS.length, labels },
  };
}

export function normalizeSetupChecklist(input) {
  const source = input && typeof input === 'object' ? input : {};
  const reasons = Array.isArray(source.reasons) ? source.reasons : [];
  return {
    mandatory: objectWithKeys(source.mandatory, A_PLUS_MANDATORY_ITEMS),
    confluence: objectWithKeys(source.confluence, A_PLUS_CONFLUENCE_ITEMS),
    reasons: [0, 1, 2].map(index => String(reasons[index] || '')),
    state: objectWithKeys(source.state, A_PLUS_STATE_ITEMS),
    legacy: source.legacy && typeof source.legacy === 'object' ? {
      confirmed: Number(source.legacy.confirmed || 0),
      total: Number(source.legacy.total || LEGACY_CHECKLIST_ITEMS.length),
      labels: Array.isArray(source.legacy.labels) ? source.legacy.labels.map(String) : [],
    } : null,
  };
}

function findSubjectiveTerms(reasons) {
  const text = reasons.join(' ').toLocaleLowerCase('ro-RO');
  return SUBJECTIVE_SETUP_TERMS.filter(term => new RegExp(`(^|[^a-zăâîșț])${term}([^a-zăâîșț]|$)`, 'iu').test(text));
}

export function evaluateSetupChecklist(input, { rr = 0 } = {}) {
  const checklist = normalizeSetupChecklist(input);
  const rrPassed = Number(rr) >= 3;
  const manualMandatory = A_PLUS_MANDATORY_ITEMS.slice(0, -1).filter(([key]) => checklist.mandatory[key]).length;
  const structuralRrPassed = checklist.mandatory.structuralRr && rrPassed;
  const mandatoryPassed = manualMandatory + (structuralRrPassed ? 1 : 0);
  const confluenceCount = A_PLUS_CONFLUENCE_ITEMS.filter(([key]) => checklist.confluence[key]).length;
  const filledReasons = checklist.reasons.map(reason => reason.trim()).filter(Boolean);
  const subjectiveTerms = findSubjectiveTerms(filledReasons);
  const objectiveReasonsPassed = filledReasons.length >= 2 && subjectiveTerms.length === 0;
  const assessed = mandatoryPassed > 0
    || confluenceCount > 0
    || filledReasons.length > 0
    || A_PLUS_STATE_ITEMS.some(([key]) => checklist.state[key]);
  const stateWarnings = assessed ? A_PLUS_STATE_ITEMS.filter(([key]) => !checklist.state[key]).length : 0;
  const hasLegacy = Boolean(checklist.legacy);
  const isAPlus = mandatoryPassed === A_PLUS_MANDATORY_ITEMS.length && objectiveReasonsPassed;
  const verdict = !assessed
    ? hasLegacy ? 'LEGACY CHECKLIST' : 'NOT ASSESSED'
    : mandatoryPassed < A_PLUS_MANDATORY_ITEMS.length
      ? 'SETUP INCOMPLETE'
      : !objectiveReasonsPassed
        ? 'WRITING NEEDS REVIEW'
        : 'A+ READY';

  return {
    checklist,
    assessed,
    hasLegacy,
    isAPlus,
    verdict,
    mandatoryPassed,
    mandatoryTotal: A_PLUS_MANDATORY_ITEMS.length,
    confluenceCount,
    confluenceTotal: A_PLUS_CONFLUENCE_ITEMS.length,
    filledReasonCount: filledReasons.length,
    objectiveReasonsPassed,
    subjectiveTerms,
    rrPassed,
    stateWarnings,
  };
}
