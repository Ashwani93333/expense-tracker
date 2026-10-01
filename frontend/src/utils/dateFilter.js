// ─── Date Filter helpers ──────────────────────────────────────────────────────
// A "dateFilter" state object shape:
//   { mode: 'month'|'year'|'custom', month: 'YYYY-MM', year: Number,
//     dateFrom: 'YYYY-MM-DD', dateTo: 'YYYY-MM-DD' }
// `month` is always kept populated so budget-setting (always monthly) still works.

export const getCurrentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

export const getCurrentYear = () => new Date().getFullYear();

export const todayISO = () => new Date().toISOString().slice(0, 10);

export const monthsBetween = (startMonth, endMonth) => {
  const [sy, sm] = startMonth.split('-').map(Number);
  const [ey, em] = endMonth.split('-').map(Number);
  const out = [];
  let y = sy, m = sm;
  while (y < ey || (y === ey && m <= em)) {
    out.push(`${y}-${String(m).padStart(2, '0')}`);
    m += 1;
    if (m > 12) { m = 1; y += 1; }
  }
  return out;
};

/** Builds backend query params (month | year | dateFrom+dateTo) from a filter.
 *  Respects the active `mode` so stale values from other modes never leak into
 *  the request (e.g. leftover custom dates must not override a month view).
 *  Also tolerant of already-processed/raw param objects ({ month } | { year }
 *  | { dateFrom, dateTo }) that carry no `mode`. */
export const toQueryParams = (filter) => {
  if (!filter) return { month: getCurrentMonth() };
  if (filter.mode === 'custom' && filter.dateFrom && filter.dateTo) {
    return { dateFrom: filter.dateFrom, dateTo: filter.dateTo };
  }
  if (filter.mode === 'year') {
    return { year: filter.year || getCurrentYear() };
  }
  if (filter.mode === 'month') {
    return { month: filter.month || getCurrentMonth() };
  }
  // Already-processed/raw param objects (no mode) — legacy fallback.
  if (filter.dateFrom && filter.dateTo) return { dateFrom: filter.dateFrom, dateTo: filter.dateTo };
  if (filter.year) return { year: filter.year };
  return { month: filter.month || getCurrentMonth() };
};

/** True when an expense date (YYYY-MM-DD) falls inside the current filter. */
export const isInFilterRange = (dateStr, filter) => {
  if (!dateStr) return false;
  const ds = String(dateStr);
  if (filter.mode === 'year' && filter.year) {
    return ds.startsWith(String(filter.year));
  }
  if (filter.mode === 'custom' && filter.dateFrom && filter.dateTo) {
    return ds >= filter.dateFrom && ds <= filter.dateTo;
  }
  const month = filter?.month || getCurrentMonth();
  return ds.startsWith(month);
};

/** Human-readable label for the current filter. */
export const describeFilter = (filter) => {
  if (!filter) return '';
  if (filter.mode === 'year' && filter.year) return String(filter.year);
  if (filter.mode === 'custom' && filter.dateFrom && filter.dateTo) {
    const fmt = (d) => new Date(d + 'T12:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    return `${fmt(filter.dateFrom)} – ${fmt(filter.dateTo)}`;
  }
  const month = filter?.month || getCurrentMonth();
  return new Date(month + '-01').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
};

/** The month used for always-monthly operations like setting a budget. */
export const activeMonth = (filter) => filter?.month || getCurrentMonth();

// ─── Account period floor ─────────────────────────────────────────────────────
// An account cannot reach back before it existed. A user who signs up this month
// has no data in any earlier period, so the app never offers to navigate there
// and never lets them file an expense dated before their signup month. Because
// the floor is the account's own creation month, existing accounts keep full
// access to everything they recorded.

/** The earliest month ('YYYY-MM') an account may view or record, or null if unknown. */
export const earliestMonthFor = (user) => {
  const createdAt = user?.createdAt;
  if (!createdAt || typeof createdAt !== 'string' || createdAt.length < 7) return null;
  return createdAt.slice(0, 7);
};

/** True when `month` ('YYYY-MM') is before the account's floor. */
export const isBeforeFloor = (month, floor) => {
  if (!month || !floor) return false;
  return String(month) < String(floor);
};

/** True when a filter would show periods the account has no access to. */
export const filterReachesBeforeFloor = (filter, floor) => {
  if (!filter || !floor) return false;
  if (filter.mode === 'custom') return isBeforeFloor(filter.dateFrom?.slice(0, 7), floor);
  if (filter.mode === 'year') return Number(filter.year) < Number(floor.slice(0, 4));
  return isBeforeFloor(filter.month, floor);
};

/** The same filter, moved forward to the floor so it never shows forbidden data. */
export const clampFilterToFloor = (filter, floor) => {
  if (!filter || !floor || !filterReachesBeforeFloor(filter, floor)) return filter;
  const clamped = { ...filter };
  if (filter.mode === 'custom') {
    if (clamped.dateFrom < `${floor}-01`) clamped.dateFrom = `${floor}-01`;
  } else if (filter.mode === 'year') {
    clamped.year = Number(floor.slice(0, 4));
  } else if (isBeforeFloor(filter.month, floor)) {
    clamped.month = floor;
    clamped.year = Number(floor.slice(0, 4));
  }
  return clamped;
};

/** The previous month ('YYYY-MM') relative to `month`. */
export const previousMonth = (month) => {
  const [y, m] = String(month).split('-').map(Number);
  const d = new Date(y, m - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};