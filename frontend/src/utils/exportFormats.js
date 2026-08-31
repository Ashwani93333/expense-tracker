export const toSlug = (s) =>
  (s || '')
    .toString()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'report';

export const downloadBlob = (filename, blob) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

export const getAmount = (e) => Number(e.amount) || 0;

export const dateOf = (e) => e.expenseDate || e.date || '';

const claimSheetName = (name, names) => {
  let safe = String(name).slice(0, 31);
  if (names.has(safe)) safe = `${String(name).slice(0, 27)}-2`;
  names.add(safe);
  return safe;
};

const setWidths = (ws, widths) => {
  ws['!cols'] = widths.map(w => ({ wch: w }));
};

export const categoryTotals = (expenses) => {
  const map = {};
  expenses.forEach(e => {
    const name = e.categoryName || 'Uncategorized';
    map[name] = (map[name] || 0) + getAmount(e);
  });
  return Object.entries(map).sort((a, b) => b[1] - a[1]);
};

export const paymentTotals = (expenses) => {
  const map = {};
  expenses.forEach(e => {
    const name = e.paidByName || 'Unknown';
    map[name] = (map[name] || 0) + getAmount(e);
  });
  return Object.entries(map).sort((a, b) => b[1] - a[1]);
};

export const buildExpenseRows = (expenses, forGroup) =>
  expenses
    .map(e => {
      if (forGroup) {
        return {
          Date: dateOf(e),
          Description: e.description || 'Expense',
          Category: e.categoryName || 'Uncategorized',
          'Paid By': e.paidByName || 'Unknown',
          'Split Type': e.splitType || 'EQUAL',
          Amount: getAmount(e),
          Splits: (e.splits || [])
            .map(s => `${s.userName || s.name}: ${(s.shareAmount || 0).toFixed(2)}${s.isSettled ? ' (settled)' : ''}`)
            .join('; '),
        };
      }
      return {
        Date: dateOf(e),
        Description: e.description || 'Expense',
        Category: e.categoryName || 'Uncategorized',
        Amount: getAmount(e),
      };
    })
    .sort((a, b) => new Date(b.Date) - new Date(a.Date));

export const exportToCSV = (filename, rows) => {
  if (!rows) return;
  const keys = Object.keys(rows[0] || {});
  const esc = v => {
    const s = v == null ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
  };
  const csv = [
    keys.join(','),
    ...rows.map(r => keys.map(k => esc(r[k])).join(',')),
  ].join('\n');
  downloadBlob(filename, new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' }));
};

export const exportToJSON = (filename, data) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  downloadBlob(filename, blob);
};

export const exportToExcel = async (filename, { title, subtitle, stats, tables, expenseColumns, expenseRows }) => {
  const { utils, writeFile } = await import('xlsx');
  const wb = utils.book_new();
  const names = new Set();

  const summaryRows = [
    [title],
    [subtitle],
    [],
    ...stats.map(([label, value]) => [label, value]),
    [],
  ];
  tables.forEach(t => {
    summaryRows.push([t.name]);
    summaryRows.push(t.columns);
    t.rows.forEach(r => summaryRows.push(r));
    summaryRows.push([]);
  });
  const summaryWs = utils.aoa_to_sheet(summaryRows);
  setWidths(summaryWs, [40, 24]);
  utils.book_append_sheet(wb, summaryWs, claimSheetName('Summary', names));

  tables.forEach(t => {
    const ws = utils.aoa_to_sheet([t.columns, ...t.rows]);
    setWidths(ws, t.columns.map(() => 26));
    utils.book_append_sheet(wb, ws, claimSheetName(t.name, names));
  });

  if (expenseRows && expenseRows.length > 0) {
    const ws = utils.json_to_sheet(expenseRows);
    const widths = expenseColumns.map((c, i) => (i === 1 ? 44 : 24));
    setWidths(ws, widths);
    utils.book_append_sheet(wb, ws, claimSheetName('Expenses', names));
  }

  writeFile(wb, filename, { compression: true });
};