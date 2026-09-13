import React, { useState, useEffect, useCallback } from 'react';
import { X, Download, FileText, Users, ChevronDown, FileSpreadsheet, FileType, Check } from 'lucide-react';
import { useExpense } from '../../context/ExpenseContext';
import { groupsApi, expensesApi } from '../../services/api';
import { DateFilterBar } from '../layout/DateFilterBar';
import { describeFilter } from '../../utils/dateFilter';
import {
  toSlug, getAmount, categoryTotals, paymentTotals,
  buildExpenseRows, exportToCSV, exportToExcel,
} from '../../utils/exportFormats';

const FORMATS = [
  { id: 'pdf', label: 'PDF', icon: FileText, hint: 'Print / Save as PDF' },
  { id: 'xlsx', label: 'Excel (.xlsx)', icon: FileSpreadsheet, hint: 'Workbook with sheets' },
  { id: 'csv', label: 'CSV', icon: FileType, hint: 'Plain spreadsheet table' },
];

const pct = (amt, total) => (total > 0 ? Number(((amt / total) * 100).toFixed(1)) : 0);

const INR = (v) => `₹${Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const PDF_SHARED_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
  @page { size: A4; margin: 16mm 14mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1e1e1e; background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }

  .report-header {
    background: linear-gradient(135deg, #0f0f0f 0%, #1a1a2e 50%, #16213e 100%);
    color: #fff; padding: 36px 40px; border-radius: 12px; margin-bottom: 28px;
    position: relative; overflow: hidden;
  }
  .report-header::after {
    content: ''; position: absolute; top: -40px; right: -40px;
    width: 160px; height: 160px; border-radius: 50%;
    background: rgba(183, 255, 0, 0.08);
  }
  .report-header::before {
    content: ''; position: absolute; bottom: -60px; right: 60px;
    width: 120px; height: 120px; border-radius: 50%;
    background: rgba(99, 102, 241, 0.06);
  }
  .report-header h1 { font-size: 22px; font-weight: 800; letter-spacing: -0.02em; margin-bottom: 4px; position: relative; z-index: 1; }
  .report-header .subtitle { font-size: 13px; color: rgba(255,255,255,0.6); font-weight: 500; position: relative; z-index: 1; }
  .report-header .brand { position: absolute; top: 36px; right: 40px; font-size: 11px; font-weight: 700; color: rgba(255,255,255,0.25); text-transform: uppercase; letter-spacing: 0.12em; z-index: 1; }

  .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 28px; }
  .stat-card {
    padding: 18px 16px; border-radius: 10px; border: 1px solid #f0f0f0;
    background: #fafafa; position: relative; overflow: hidden;
  }
  .stat-card::before {
    content: ''; position: absolute; top: 0; left: 0; width: 3px; height: 100%;
    border-radius: 0 3px 3px 0;
  }
  .stat-card.accent-green::before { background: #22c55e; }
  .stat-card.accent-blue::before { background: #3b82f6; }
  .stat-card.accent-purple::before { background: #8b5cf6; }
  .stat-card.accent-amber::before { background: #f59e0b; }
  .stat-card .stat-label { font-size: 10.5px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 6px; }
  .stat-card .stat-value { font-size: 20px; font-weight: 800; color: #111827; letter-spacing: -0.02em; }

  .section { margin-bottom: 28px; page-break-inside: avoid; }
  .section-title {
    font-size: 14px; font-weight: 800; color: #111827; margin-bottom: 14px;
    padding-bottom: 8px; border-bottom: 2px solid #f0f0f0;
    text-transform: uppercase; letter-spacing: 0.04em;
  }

  .data-table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
  .data-table thead th {
    padding: 10px 14px; text-align: left; font-weight: 700; font-size: 10.5px;
    text-transform: uppercase; letter-spacing: 0.06em; color: #6b7280;
    background: #f9fafb; border-bottom: 2px solid #e5e7eb;
  }
  .data-table tbody td {
    padding: 10px 14px; border-bottom: 1px solid #f3f4f6; color: #374151;
  }
  .data-table tbody tr:nth-child(even) { background: #fafbfc; }
  .data-table tbody tr:last-child td { border-bottom: 2px solid #e5e7eb; }
  .data-table .text-right { text-align: right; }
  .data-table .text-center { text-align: center; }
  .data-table .font-bold { font-weight: 700; }
  .data-table .text-muted { color: #9ca3af; }

  .progress-row { display: flex; align-items: center; gap: 10px; }
  .progress-bar { flex: 1; height: 6px; background: #f3f4f6; border-radius: 3px; overflow: hidden; }
  .progress-fill { height: 100%; border-radius: 3px; }
  .progress-pct { font-size: 11px; font-weight: 700; color: #6b7280; min-width: 42px; text-align: right; }

  .day-group { margin-bottom: 18px; page-break-inside: avoid; }
  .day-header {
    display: flex; justify-content: space-between; align-items: center;
    padding: 10px 14px; background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
    border-radius: 8px; margin-bottom: 4px; border-left: 3px solid #6366f1;
  }
  .day-header .day-date { font-size: 12.5px; font-weight: 700; color: #111827; }
  .day-header .day-total { font-size: 12.5px; font-weight: 700; color: #ef4444; }

  .expense-item {
    display: flex; justify-content: space-between; align-items: flex-start;
    padding: 10px 14px 10px 20px; border-bottom: 1px solid #f9fafb; font-size: 12.5px;
  }
  .expense-item:last-child { border-bottom: none; }
  .expense-item:hover { background: #fafbfc; }
  .expense-info { flex: 1; }
  .expense-desc { font-weight: 600; color: #111827; margin-bottom: 2px; }
  .expense-meta { font-size: 11px; color: #9ca3af; }
  .expense-amount { font-weight: 700; color: #ef4444; white-space: nowrap; margin-left: 16px; }
  .expense-settled { color: #22c55e; font-size: 11px; margin-left: 4px; }

  .splits-detail { font-size: 10.5px; color: #9ca3af; margin-top: 4px; padding-left: 2px; }
  .split-item { display: inline; }
  .split-settled { color: #22c55e; }

  .report-footer {
    margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb;
    display: flex; justify-content: space-between; align-items: center;
    font-size: 10.5px; color: #9ca3af;
  }
  .report-footer .generated { font-weight: 500; }
  .report-footer .brand-footer { font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; }

  .empty-state { text-align: center; padding: 40px 20px; color: #9ca3af; font-size: 13px; }

  @media print {
    body { background: #fff; }
    .report-header { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .stat-card { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .data-table thead th { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .data-table tbody tr:nth-child(even) { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .day-header { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .progress-fill { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .section { page-break-inside: avoid; }
    .day-group { page-break-inside: avoid; }
  }
`;

const CATEGORY_COLORS = [
  '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899',
  '#f43f5e', '#ef4444', '#f97316', '#f59e0b', '#eab308',
  '#84cc16', '#22c55e', '#14b8a6', '#06b6d4', '#0ea5e9',
  '#3b82f6', '#6366f1',
];

const getColor = (i) => CATEGORY_COLORS[i % CATEGORY_COLORS.length];

const generatePersonalPDF = (expenses, categories, periodLabel, currentUser) => {
  const total = expenses.reduce((s, e) => s + (e.amount || 0), 0);

  const categoryBreakdown = {};
  expenses.forEach(exp => {
    const catName = exp.categoryName || 'Uncategorized';
    if (!categoryBreakdown[catName]) categoryBreakdown[catName] = 0;
    categoryBreakdown[catName] += exp.amount || 0;
  });
  const sortedCategories = Object.entries(categoryBreakdown).sort((a, b) => b[1] - a[1]);
  const maxCat = sortedCategories.length > 0 ? sortedCategories[0][1] : 1;

  const grouped = expenses.reduce((acc, exp) => {
    const d = exp.expenseDate || exp.date || 'Unknown';
    if (!acc[d]) acc[d] = [];
    acc[d].push(exp);
    return acc;
  }, {});
  const sortedDates = Object.keys(grouped).sort((a, b) => new Date(b) - new Date(a));

  const now = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Personal Expense Report — ${periodLabel}</title>
  <style>${PDF_SHARED_STYLES}</style>
</head>
<body>
  <div class="report-header">
    <div class="brand">Finance Tracker</div>
    <h1>Personal Expense Report</h1>
    <div class="subtitle">${periodLabel}${currentUser ? ' &middot; ' + (currentUser.name || currentUser.email || '') : ''}</div>
  </div>

  <div class="stats-grid">
    <div class="stat-card accent-green">
      <div class="stat-label">Total Spent</div>
      <div class="stat-value">${INR(total)}</div>
    </div>
    <div class="stat-card accent-blue">
      <div class="stat-label">Transactions</div>
      <div class="stat-value">${expenses.length.toLocaleString('en-IN')}</div>
    </div>
    <div class="stat-card accent-purple">
      <div class="stat-label">Categories</div>
      <div class="stat-value">${sortedCategories.length}</div>
    </div>
    <div class="stat-card accent-amber">
      <div class="stat-label">Avg / Transaction</div>
      <div class="stat-value">${INR(expenses.length > 0 ? total / expenses.length : 0)}</div>
    </div>
  </div>

  ${sortedCategories.length > 0 ? `
  <div class="section">
    <div class="section-title">Category Breakdown</div>
    <table class="data-table">
      <thead>
        <tr>
          <th style="width:30%">Category</th>
          <th style="width:30%">Amount</th>
          <th style="width:40%">Distribution</th>
        </tr>
      </thead>
      <tbody>
        ${sortedCategories.map(([name, amount], i) => {
          const p = pct(amount, total);
          const barWidth = maxCat > 0 ? (amount / maxCat) * 100 : 0;
          const color = getColor(i);
          return `
          <tr>
            <td class="font-bold">${name}</td>
            <td class="text-right font-bold">${INR(amount)}</td>
            <td>
              <div class="progress-row">
                <div class="progress-bar">
                  <div class="progress-fill" style="width:${barWidth}%;background:${color};"></div>
                </div>
                <div class="progress-pct">${p}%</div>
              </div>
            </td>
          </tr>`;
        }).join('')}
      </tbody>
      <tfoot>
        <tr>
          <td class="font-bold" style="border-top:2px solid #e5e7eb;padding-top:12px;">Total</td>
          <td class="text-right font-bold" style="border-top:2px solid #e5e7eb;padding-top:12px;">${INR(total)}</td>
          <td style="border-top:2px solid #e5e7eb;padding-top:12px;font-weight:700;color:#6b7280;">100%</td>
        </tr>
      </tfoot>
    </table>
  </div>` : ''}

  <div class="section">
    <div class="section-title">Detailed Expenses</div>
    ${sortedDates.length === 0 ? '<div class="empty-state">No expenses recorded for this period.</div>' :
    sortedDates.map(dateStr => {
      const dayExpenses = grouped[dateStr];
      const dayTotal = dayExpenses.reduce((s, e) => s + (e.amount || 0), 0);
      const dateLabel = new Date(dateStr + 'T12:00:00').toLocaleDateString('en-IN', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      });
      return `
      <div class="day-group">
        <div class="day-header">
          <span class="day-date">${dateLabel}</span>
          <span class="day-total">${INR(dayTotal)}</span>
        </div>
        ${dayExpenses.map(exp => `
          <div class="expense-item">
            <div class="expense-info">
              <div class="expense-desc">${exp.description || 'Expense'}</div>
              <div class="expense-meta">${exp.categoryName || 'Uncategorized'}</div>
            </div>
            <div class="expense-amount">${INR(exp.amount)}</div>
          </div>
        `).join('')}
      </div>`;
    }).join('')}
  </div>

  <div class="report-footer">
    <span class="generated">Generated on ${now}</span>
    <span class="brand-footer">Finance Tracker</span>
  </div>
</body>
</html>`;

  const printWindow = window.open('', '_blank');
  printWindow.document.write(html);
  printWindow.document.close();
  setTimeout(() => printWindow.print(), 600);
};

const generateGroupPDF = (groupExpenses, groupName, periodLabel, members) => {
  const total = groupExpenses.reduce((s, e) => s + (e.amount || 0), 0);

  const categoryBreakdown = {};
  groupExpenses.forEach(exp => {
    const catName = exp.categoryName || 'Uncategorized';
    if (!categoryBreakdown[catName]) categoryBreakdown[catName] = 0;
    categoryBreakdown[catName] += exp.amount || 0;
  });
  const sortedCategories = Object.entries(categoryBreakdown).sort((a, b) => b[1] - a[1]);
  const maxCat = sortedCategories.length > 0 ? sortedCategories[0][1] : 1;

  const paidByBreakdown = {};
  groupExpenses.forEach(exp => {
    const payer = exp.paidByName || 'Unknown';
    if (!paidByBreakdown[payer]) paidByBreakdown[payer] = 0;
    paidByBreakdown[payer] += exp.amount || 0;
  });
  const sortedPayers = Object.entries(paidByBreakdown).sort((a, b) => b[1] - a[1]);
  const maxPayer = sortedPayers.length > 0 ? sortedPayers[0][1] : 1;

  const memberCount = members?.length || sortedPayers.length || 1;

  const grouped = groupExpenses.reduce((acc, exp) => {
    const d = exp.expenseDate || exp.date || 'Unknown';
    if (!acc[d]) acc[d] = [];
    acc[d].push(exp);
    return acc;
  }, {});
  const sortedDates = Object.keys(grouped).sort((a, b) => new Date(b) - new Date(a));

  const now = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  const PAYER_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f97316', '#22c55e', '#06b6d4'];

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${groupName} — Expense Report — ${periodLabel}</title>
  <style>${PDF_SHARED_STYLES}</style>
</head>
<body>
  <div class="report-header">
    <div class="brand">Finance Tracker</div>
    <h1>Group Expense Report</h1>
    <div class="subtitle">${groupName} &middot; ${periodLabel}</div>
  </div>

  <div class="stats-grid">
    <div class="stat-card accent-green">
      <div class="stat-label">Total Spent</div>
      <div class="stat-value">${INR(total)}</div>
    </div>
    <div class="stat-card accent-blue">
      <div class="stat-label">Transactions</div>
      <div class="stat-value">${groupExpenses.length.toLocaleString('en-IN')}</div>
    </div>
    <div class="stat-card accent-purple">
      <div class="stat-label">Members</div>
      <div class="stat-value">${memberCount}</div>
    </div>
    <div class="stat-card accent-amber">
      <div class="stat-label">Avg / Person</div>
      <div class="stat-value">${INR(total / memberCount)}</div>
    </div>
  </div>

  ${sortedCategories.length > 0 ? `
  <div class="section">
    <div class="section-title">Category Breakdown</div>
    <table class="data-table">
      <thead>
        <tr>
          <th style="width:30%">Category</th>
          <th style="width:30%">Amount</th>
          <th style="width:40%">Distribution</th>
        </tr>
      </thead>
      <tbody>
        ${sortedCategories.map(([name, amount], i) => {
          const p = pct(amount, total);
          const barWidth = maxCat > 0 ? (amount / maxCat) * 100 : 0;
          const color = getColor(i);
          return `
          <tr>
            <td class="font-bold">${name}</td>
            <td class="text-right font-bold">${INR(amount)}</td>
            <td>
              <div class="progress-row">
                <div class="progress-bar">
                  <div class="progress-fill" style="width:${barWidth}%;background:${color};"></div>
                </div>
                <div class="progress-pct">${p}%</div>
              </div>
            </td>
          </tr>`;
        }).join('')}
      </tbody>
      <tfoot>
        <tr>
          <td class="font-bold" style="border-top:2px solid #e5e7eb;padding-top:12px;">Total</td>
          <td class="text-right font-bold" style="border-top:2px solid #e5e7eb;padding-top:12px;">${INR(total)}</td>
          <td style="border-top:2px solid #e5e7eb;padding-top:12px;font-weight:700;color:#6b7280;">100%</td>
        </tr>
      </tfoot>
    </table>
  </div>` : ''}

  ${sortedPayers.length > 0 ? `
  <div class="section">
    <div class="section-title">Payment Summary</div>
    <table class="data-table">
      <thead>
        <tr>
          <th style="width:30%">Member</th>
          <th style="width:30%">Total Paid</th>
          <th style="width:40%">Contribution</th>
        </tr>
      </thead>
      <tbody>
        ${sortedPayers.map(([name, amount], i) => {
          const p = pct(amount, total);
          const barWidth = maxPayer > 0 ? (amount / maxPayer) * 100 : 0;
          const color = PAYER_COLORS[i % PAYER_COLORS.length];
          return `
          <tr>
            <td class="font-bold">${name}</td>
            <td class="text-right font-bold">${INR(amount)}</td>
            <td>
              <div class="progress-row">
                <div class="progress-bar">
                  <div class="progress-fill" style="width:${barWidth}%;background:${color};"></div>
                </div>
                <div class="progress-pct">${p}%</div>
              </div>
            </td>
          </tr>`;
        }).join('')}
      </tbody>
      <tfoot>
        <tr>
          <td class="font-bold" style="border-top:2px solid #e5e7eb;padding-top:12px;">Total</td>
          <td class="text-right font-bold" style="border-top:2px solid #e5e7eb;padding-top:12px;">${INR(total)}</td>
          <td style="border-top:2px solid #e5e7eb;padding-top:12px;font-weight:700;color:#6b7280;">100%</td>
        </tr>
      </tfoot>
    </table>
  </div>` : ''}

  <div class="section">
    <div class="section-title">Detailed Expenses</div>
    ${sortedDates.length === 0 ? '<div class="empty-state">No expenses recorded for this period.</div>' :
    sortedDates.map(dateStr => {
      const dayExpenses = grouped[dateStr];
      const dayTotal = dayExpenses.reduce((s, e) => s + (e.amount || 0), 0);
      const dateLabel = new Date(dateStr + 'T12:00:00').toLocaleDateString('en-IN', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      });
      return `
      <div class="day-group">
        <div class="day-header">
          <span class="day-date">${dateLabel}</span>
          <span class="day-total">${INR(dayTotal)}</span>
        </div>
        ${dayExpenses.map(exp => `
          <div class="expense-item">
            <div class="expense-info">
              <div class="expense-desc">${exp.description || 'Expense'}</div>
              <div class="expense-meta">${exp.categoryName || 'Uncategorized'} &middot; Paid by ${exp.paidByName || 'Unknown'} &middot; ${(exp.splitType || 'EQUAL').toLowerCase()} split</div>
              ${exp.splits && exp.splits.length > 0 ? `
                <div class="splits-detail">
                  ${exp.splits.map(s => `<span class="split-item">${s.userName || s.name}: ${INR(s.shareAmount || 0)}${s.isSettled ? ' <span class="split-settled">&#10003;</span>' : ''}</span>`).join(' &middot; ')}
                </div>
              ` : ''}
            </div>
            <div class="expense-amount">${INR(exp.amount)}</div>
          </div>
        `).join('')}
      </div>`;
    }).join('')}
  </div>

  <div class="report-footer">
    <span class="generated">Generated on ${now}</span>
    <span class="brand-footer">Finance Tracker</span>
  </div>
</body>
</html>`;

  const printWindow = window.open('', '_blank');
  printWindow.document.write(html);
  printWindow.document.close();
  setTimeout(() => printWindow.print(), 600);
};

export const ExportModal = ({ isOpen, onClose, exportType = 'personal', initialGroupId = null }) => {
  const { categories, groups, dateFilter, currentUser } = useExpense();
  const [selectedGroupId, setSelectedGroupId] = useState(initialGroupId || (groups.length > 0 ? groups[0].id : null));
  const [groupExpenses, setGroupExpenses] = useState([]);
  const [personalExpenses, setPersonalExpenses] = useState([]);
  const [format, setFormat] = useState('pdf');
  const [isLoadingData, setIsLoadingData] = useState(false);

  const fetchPersonalExpenses = useCallback(async () => {
    setIsLoadingData(true);
    try {
      const data = await expensesApi.list(dateFilter);
      setPersonalExpenses(data || []);
    } catch (err) {
      console.error('Failed to fetch personal expenses:', err);
      setPersonalExpenses([]);
    } finally {
      setIsLoadingData(false);
    }
  }, [dateFilter]);

  const fetchGroupExpenses = useCallback(async () => {
    if (!selectedGroupId) return;
    setIsLoadingData(true);
    try {
      const data = await groupsApi.listExpenses(selectedGroupId, dateFilter);
      setGroupExpenses(data || []);
    } catch (err) {
      console.error('Failed to fetch group expenses:', err);
      setGroupExpenses([]);
    } finally {
      setIsLoadingData(false);
    }
  }, [selectedGroupId, dateFilter]);

  useEffect(() => {
    if (!isOpen) return;
    if (exportType === 'personal') {
      fetchPersonalExpenses();
    } else {
      fetchGroupExpenses();
    }
  }, [dateFilter, selectedGroupId, exportType, isOpen]);

  useEffect(() => {
    if (initialGroupId) setSelectedGroupId(initialGroupId);
  }, [initialGroupId]);

  const handleExport = async () => {
    const periodLabel = describeFilter(dateFilter);
    const group = groups.find(g => g.id === selectedGroupId);
    const isGroup = exportType === 'group';
    const expenses = isGroup ? groupExpenses : personalExpenses;
    const baseName = `${
      isGroup ? `group-expenses-${toSlug(group?.name)}` : 'personal-expenses'
    }-${toSlug(periodLabel)}`;

    if (format === 'pdf') {
      if (isGroup) {
        generateGroupPDF(expenses, group?.name || 'Group', periodLabel, group?.members);
      } else {
        generatePersonalPDF(expenses, categories, periodLabel, currentUser);
      }
      return;
    }

    const total = expenses.reduce((s, e) => s + getAmount(e), 0);
    const cats = categoryTotals(expenses);
    const rows = buildExpenseRows(expenses, isGroup);

    if (format === 'csv') {
      exportToCSV(`${baseName}.csv`, rows, {
        title: isGroup ? `Group Expense Report — ${group?.name || 'Group'}` : 'Personal Expense Report',
        period: periodLabel,
        stats: isGroup
          ? { 'Total Expenses': INR(total), 'Transactions': expenses.length, 'Members': group?.members?.length || 1, 'Avg / Person': INR(total / (group?.members?.length || 1)) }
          : { 'Total Expenses': INR(total), 'Transactions': expenses.length, 'Categories': cats.length, 'Avg / Transaction': INR(expenses.length ? total / expenses.length : 0) },
        isGroup,
      });
      return;
    }

    const memberCount = isGroup ? (group?.members?.length || 1) : 0;
    const stats = isGroup
      ? [
          ['Total Expenses', INR(total)],
          ['Transactions', expenses.length],
          ['Members', memberCount],
          ['Avg / Person', INR(total / (memberCount || 1))],
        ]
      : [
          ['Total Expenses', INR(total)],
          ['Transactions', expenses.length],
          ['Categories', cats.length],
          ['Avg / Transaction', INR(expenses.length ? total / expenses.length : 0)],
        ];

    const tables = [{
      name: 'Category Breakdown',
      columns: ['Category', 'Amount', '% of Total'],
      rows: cats.map(([name, amt]) => [name, INR(amt), `${pct(amt, total)}%`]),
    }];
    if (isGroup) {
      tables.push({
        name: 'Payment Summary',
        columns: ['Member', 'Total Paid', '% of Total'],
        rows: paymentTotals(expenses).map(([name, amt]) => [name, INR(amt), `${pct(amt, total)}%`]),
      });
    }

    await exportToExcel(`${baseName}.xlsx`, {
      title: isGroup ? `Group Expense Report — ${group?.name || 'Group'}` : 'Personal Expense Report',
      subtitle: `${periodLabel}${!isGroup && currentUser ? ' · ' + (currentUser.name || currentUser.email || '') : ''}`,
      stats,
      tables,
      expenseColumns: isGroup
        ? ['Date', 'Description', 'Category', 'Paid By', 'Split Type', 'Amount', 'Splits']
        : ['Date', 'Description', 'Category', 'Amount'],
      expenseRows: rows,
    });
  };

  if (!isOpen) return null;

  const monthLabel = describeFilter(dateFilter);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
    }} onClick={onClose}>
      <div
        style={{
          background: '#fff', borderRadius: '16px', width: '460px', maxWidth: '90vw',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
          animation: 'slideUp 0.2s ease',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 24px', borderBottom: '1px solid #f0f0f0',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: exportType === 'personal' ? 'rgba(183, 255, 0, 0.12)' : 'rgba(99, 102, 241, 0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {exportType === 'personal'
                ? <FileText size={18} color="#1a1a1a" />
                : <Users size={18} color="#6366f1" />
              }
            </div>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#1a1a1a', margin: 0 }}>
                Export {exportType === 'personal' ? 'Personal' : 'Group'} Expenses
              </h3>
              <p style={{ fontSize: '12px', color: '#737373', margin: 0 }}>Choose a format and download your report</p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#a3a3a3', padding: '4px', borderRadius: '6px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#f5f5f5'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '24px' }}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#525252', display: 'block', marginBottom: '6px' }}>
              Select Period
            </label>
            <DateFilterBar />
          </div>

          {exportType === 'group' && (
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#525252', display: 'block', marginBottom: '6px' }}>
                Select Group
              </label>
              <div style={{ position: 'relative' }}>
                <Users size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#a3a3a3' }} />
                <select
                  value={selectedGroupId || ''}
                  onChange={e => setSelectedGroupId(e.target.value)}
                  style={{
                    width: '100%', padding: '10px 32px 10px 36px',
                    border: '1px solid #e5e5e5', borderRadius: '8px',
                    fontSize: '13px', fontWeight: 500, color: '#1a1a1a',
                    background: '#fafafa', fontFamily: 'var(--font)',
                    appearance: 'none', outline: 'none', cursor: 'pointer',
                  }}
                >
                  {groups.length === 0 && <option value="">No groups available</option>}
                  {groups.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
                <ChevronDown size={14} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#a3a3a3', pointerEvents: 'none' }} />
              </div>
            </div>
          )}

          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#525252', display: 'block', marginBottom: '6px' }}>
              Export Format
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {FORMATS.map(f => {
                const Icon = f.icon;
                const active = format === f.id;
                return (
                  <button
                    key={f.id}
                    onClick={() => setFormat(f.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      padding: '10px 12px', borderRadius: '10px', cursor: 'pointer',
                      border: active ? '1.5px solid #1a1a1a' : '1px solid #e5e5e5',
                      background: active ? '#f7f7f7' : '#fafafa',
                      color: '#1a1a1a', fontFamily: 'var(--font)',
                      fontSize: '12px', fontWeight: 600, textAlign: 'left',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <Icon size={15} color={active ? '#1a1a1a' : '#a3a3a3'} />
                    <span style={{ flex: 1 }}>{f.label}</span>
                    {active && <Check size={14} color="#1a1a1a" />}
                  </button>
                );
              })}
            </div>
            <p style={{ fontSize: '11px', color: '#a3a3a3', marginTop: '6px' }}>
              {FORMATS.find(f => f.id === format)?.hint}
            </p>
          </div>

          <div style={{
            padding: '16px', background: '#fafafa', borderRadius: '10px',
            border: '1px solid #f0f0f0', marginBottom: '20px',
          }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#737373', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
              Preview
            </div>
            <div style={{ display: 'flex', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '11px', color: '#a3a3a3' }}>Period</div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#1a1a1a' }}>{monthLabel}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#a3a3a3' }}>Expenses</div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#1a1a1a' }}>
                  {isLoadingData ? '...' : (exportType === 'personal' ? personalExpenses.length : groupExpenses.length)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#a3a3a3' }}>Total</div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#1a1a1a' }}>
                  {isLoadingData ? '...' : INR(exportType === 'personal'
                    ? personalExpenses.reduce((s, e) => s + (e.amount || 0), 0)
                    : groupExpenses.reduce((s, e) => s + (e.amount || 0), 0)
                  )}
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handleExport}
            disabled={isLoadingData}
            style={{
              width: '100%', padding: '12px',
              background: exportType === 'personal' ? '#050505' : '#6366f1',
              color: exportType === 'personal' ? '#B7FF00' : '#fff',
              border: 'none', borderRadius: '10px',
              fontSize: '13px', fontWeight: 700,
              cursor: isLoadingData ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              fontFamily: 'var(--font)',
              opacity: isLoadingData ? 0.7 : 1,
              transition: 'var(--t-fast)',
            }}
          >
            <Download size={15} />
            {isLoadingData ? 'Loading expenses...' : `Download ${FORMATS.find(f => f.id === format)?.label || 'report'}`}
          </button>
        </div>
      </div>
    </div>
  );
};
