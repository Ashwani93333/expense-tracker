// ─── Time-series analytics helpers ─────────────────────────────────────────────
// Every average in the analytics feature is bucketed by *time* (day / week /
// month) instead of being one flat `total / count` over the whole range.
// Nothing here touches React so it stays cheap to call inside a render.

const MS_DAY = 86400000;

const pad = (n) => String(n).padStart(2, '0');

/** Local-midnight Date from a `YYYY-MM-DD` string (TZ safe, no off-by-one). */
export const parseISODate = (s) => {
  const [y, m, d] = String(s).slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const toISODate = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const addDays = (d, n) => {
  const next = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  next.setDate(next.getDate() + n);
  return next;
};

export const daysBetween = (a, b) =>
  Math.round((parseISODate(toISODate(b)) - parseISODate(toISODate(a))) / MS_DAY);

/** Resolves the active `dateFilter` into a concrete inclusive [start, end] range. */
export const resolveFilterRange = (filter) => {
  const today = new Date();
  const todayStr = toISODate(today);

  if (filter?.mode === 'custom' && filter.dateFrom && filter.dateTo) {
    const start = filter.dateFrom <= filter.dateTo ? filter.dateFrom : filter.dateTo;
    const end = filter.dateFrom <= filter.dateTo ? filter.dateTo : filter.dateFrom;
    return { start, end };
  }
  if (filter?.mode === 'year') {
    const y = filter.year || today.getFullYear();
    return { start: `${y}-01-01`, end: `${y}-12-31` };
  }
  const month = filter?.month || `${today.getFullYear()}-${pad(today.getMonth() + 1)}`;
  const [y, m] = month.split('-').map(Number);
  const lastDay = new Date(y, m, 0).getDate();
  return { start: `${month}-01`, end: `${month}-${pad(lastDay)}` };
};

/** Clamps a range end to today so future days never count as overspending. */
export const clampRangeToToday = (range) => {
  const todayStr = toISODate(new Date());
  return range.end > todayStr ? { ...range, end: todayStr } : range;
};

// ─── Granularities ─────────────────────────────────────────────────────────────

export const GRANULARITIES = [
  { id: 'day', label: 'Daily', bucketLabel: 'per day', window: 7 },
  { id: 'week', label: 'Weekly', bucketLabel: 'per week', window: 4 },
  { id: 'month', label: 'Monthly', bucketLabel: 'per month', window: 3 },
];

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Stable key for the bucket a given date falls into. */
export const bucketKeyFor = (isoDate, granularity) => {
  const d = parseISODate(isoDate);
  if (granularity === 'month') return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
  if (granularity === 'week') return toISODate(addDays(d, -((d.getDay() + 6) % 7)));
  return toISODate(d);
};

/** [startISO, endISO] of the bucket a key refers to. */
export const bucketBounds = (key, granularity) => {
  if (granularity === 'month') {
    const [y, m] = key.split('-').map(Number);
    return [toISODate(new Date(y, m - 1, 1)), toISODate(new Date(y, m, 0))];
  }
  const start = parseISODate(key);
  if (granularity === 'week') return [key, toISODate(addDays(start, 6))];
  return [key, key];
};

const shortLabel = (isoDate) => {
  const d = parseISODate(isoDate);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
};

const bucketLabel = (key, granularity, bounds) => {
  const [start, end] = bounds;
  if (granularity === 'month') {
    const d = parseISODate(start);
    return `${MONTHS[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`;
  }
  if (granularity === 'week') return `${shortLabel(start)} – ${shortLabel(end)}`;
  return shortLabel(start);
};

const bucketFullLabel = (key, granularity, bounds) => {
  const [start, end] = bounds;
  if (granularity === 'month') {
    const d = parseISODate(start);
    return d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  }
  if (granularity === 'week') return `Week of ${shortLabel(start)} – ${shortLabel(end)}`;
  return parseISODate(start).toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  });
};

/** Walks every bucket key between two dates, gap-free. */
const enumerateBucketKeys = (range, granularity) => {
  const keys = [];
  const rangeEnd = parseISODate(range.end);
  // Snap back to the start of the first bucket so no bucket is ever orphaned.
  let key = bucketKeyFor(range.start, granularity);
  for (let guard = 0; guard < 2000; guard += 1) {
    const [bucketStart, bucketEnd] = bucketBounds(key, granularity);
    const start = bucketStart > range.start ? bucketStart : range.start;
    const end = bucketEnd < range.end ? bucketEnd : range.end;
    if (start > end) break;
    keys.push({ key, bounds: [start, end] });
    const next = addDays(parseISODate(end), 1);
    if (next.getTime() > rangeEnd.getTime()) break;
    key = bucketKeyFor(toISODate(next), granularity);
  }
  return keys;
};

/**
 * Core aggregation: one row per time bucket with spend, transaction count and
 * the per-bucket average — so averages are always "per unit of time".
 */
export const buildTimeSeries = (expenses, range, granularity = 'day') => {
  const buckets = new Map();
  enumerateBucketKeys(range, granularity).forEach(({ key, bounds }) => {
    buckets.set(key, {
      key,
      start: bounds[0],
      end: bounds[1],
      label: bucketLabel(key, granularity, bounds),
      fullLabel: bucketFullLabel(key, granularity, bounds),
      spend: 0,
      count: 0,
      items: [],
    });
  });

  let totalSpend = 0;
  let totalCount = 0;
  let uncategorisedSpend = 0;
  const orphanTotal = { spend: 0, count: 0 };
  const seenDates = new Set();

  expenses.forEach((e) => {
    const iso = (e.expenseDate || e.date || '').slice(0, 10);
    if (!iso) return;
    const amount = Number(e.amount) || 0;
    // Guard on the real date window, not just the bucket key: clipped boundary
    // buckets (e.g. the first week of a month) share a key with dates outside
    // the range, which would otherwise leak in.
    if (iso < range.start || iso > range.end) {
      orphanTotal.spend += amount;
      orphanTotal.count += 1;
      return;
    }
    const key = bucketKeyFor(iso, granularity);
    const bucket = buckets.get(key);
    if (!bucket) {
      // Outside the resolved range (or unparseable date) — keep totals honest
      // but do not invent a bucket for it.
      orphanTotal.spend += amount;
      orphanTotal.count += 1;
      return;
    }
    bucket.spend += amount;
    bucket.count += 1;
    bucket.items.push(e);
    totalSpend += amount;
    totalCount += 1;
    seenDates.add(iso);
    if (!e.categoryName) uncategorisedSpend += amount;
  });

  const rows = Array.from(buckets.values())
    .sort((a, b) => (a.key < b.key ? -1 : 1))
    .map(b => ({
      ...b,
      spend: round2(b.spend),
      avgPerTransaction: b.count > 0 ? round2(b.spend / b.count) : 0,
      avgPerDay: round2(b.spend / countDays(b.start, b.end)),
    }));

  // Trailing moving average smooths the noisy per-bucket average line.
  const window = GRANULARITIES.find(g => g.id === granularity)?.window ?? 7;
  rows.forEach((r, i) => {
    const slice = rows.slice(Math.max(0, i - window + 1), i + 1);
    r.rollingAvg = round2(slice.reduce((s, x) => s + x.spend, 0) / slice.length);
    r.rollingAvgPerTransaction = round2(
      slice.reduce((s, x) => s + x.spend, 0) /
      Math.max(1, slice.reduce((s, x) => s + x.count, 0))
    );
  });

  const rangeDays = countDays(range.start, range.end);

  return {
    granularity,
    range,
    rows,
    totals: {
      spend: round2(totalSpend),
      count: totalCount,
      activeDays: seenDates.size,
      calendarDays: rangeDays,
      avgPerTransaction: totalCount > 0 ? round2(totalSpend / totalCount) : 0,
      avgPerCalendarDay: rangeDays > 0 ? round2(totalSpend / rangeDays) : 0,
      avgPerActiveDay: seenDates.size > 0 ? round2(totalSpend / seenDates.size) : 0,
      avgPerWeek: round2(totalSpend / Math.max(1, rangeDays / 7)),
      avgPerMonth: round2(totalSpend / Math.max(1, rangeDays / 30.44)),
      uncategorisedSpend: round2(uncategorisedSpend),
      uncategorisedShare: totalSpend > 0 ? uncategorisedSpend / totalSpend : 0,
      outOfRange: { spend: round2(orphanTotal.spend), count: orphanTotal.count },
    },
    extremes: {
      biggestBucket: rows.reduce((m, r) => (!m || r.spend > m.spend ? r : m), null),
      busiestBucket: rows.reduce((m, r) => (!m || r.count > m.count ? r : m), null),
      largestTransaction: expenses.reduce((m, e) => {
        const a = Number(e.amount) || 0;
        return !m || a > m.amount ? { amount: a, label: e.description || e.categoryName || 'Expense', date: e.expenseDate || e.date } : m;
      }, null),
      quietestBucket: rows.filter(r => r.count === 0).length,
    },
    weekday: buildWeekdayProfile(expenses),
  };
};

/** Spend + count per weekday, ordered Mon→Sun. */
export const buildWeekdayProfile = (expenses) => {
  const acc = WEEKDAYS.map(day => ({ day, spend: 0, count: 0, avg: 0 }));
  expenses.forEach((e) => {
    const iso = (e.expenseDate || e.date || '').slice(0, 10);
    if (!iso) return;
    const slot = acc[parseISODate(iso).getDay()];
    slot.spend += Number(e.amount) || 0;
    slot.count += 1;
  });
  const totalCount = acc.reduce((s, d) => s + d.count, 0) || 1;
  acc.forEach(d => {
    d.spend = round2(d.spend);
    d.avg = d.count > 0 ? round2(d.spend / d.count) : 0;
    d.share = d.count / totalCount;
  });
  return [...acc.slice(1), acc[0]]; // Mon → Sun
};

/** Human wording for the active granularity, e.g. "per day". */
export const granularityLabel = (granularity) =>
  GRANULARITIES.find(g => g.id === granularity)?.bucketLabel || 'per day';

export const granularityTitle = (granularity) =>
  GRANULARITIES.find(g => g.id === granularity)?.label || 'Daily';

const countDays = (startISO, endISO) =>
  Math.max(1, Math.round((parseISODate(endISO) - parseISODate(startISO)) / MS_DAY) + 1);

export const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;