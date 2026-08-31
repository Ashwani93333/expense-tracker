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
 *  Tolerant of both full filter objects ({ mode, month, year, dateFrom, dateTo })
 *  and raw param objects ({ month } | { year } | { dateFrom, dateTo }). */
export const toQueryParams = (filter) => {
  if (!filter) return { month: getCurrentMonth() };
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