import React, { useState, useEffect } from 'react';
import { Target, Plus, Trash2, ChevronDown, Loader2, RefreshCw, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useExpense } from '../context/ExpenseContext';
import { useAuth } from '../context/AuthContext';
import { budgetsApi } from '../services/api';
import { CategoryIcon } from '../components/categories/categoryIcons';

const statusColor = (s) => ({
  OK:        '#22c55e',
  WARNING:   '#f59e0b',
  EXCEEDED:  '#ef4444',
  NO_BUDGET: '#737373',
}[s] || '#737373');

const StatusIcon = ({ status }) => ({
  OK:       <CheckCircle2 size={12} />,
  WARNING:  <AlertTriangle size={12} />,
  EXCEEDED: <AlertTriangle size={12} />,
}[status] || null);

const statusLabel = (s) => ({
  OK:        'On Track',
  WARNING:   'Warning',
  EXCEEDED:  'Exceeded',
  NO_BUDGET: 'No Limit Set',
}[s] || s);

const getCurrentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

const MONTHS = Array.from({ length: 6 }, (_, i) => {
  const d = new Date();
  d.setMonth(d.getMonth() - i);
  const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  return { value: val, label: d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) };
});

export const BudgetSettingsPage = () => {
  const { categories, updatePersonalBudget, updateCategoryBudget } = useExpense();
  const { currentUser } = useAuth();

  const [month, setMonth] = useState(getCurrentMonth());
  const [budgetStatus, setBudgetStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  const [overallInput, setOverallInput] = useState('');
  const [savingOverall, setSavingOverall] = useState(false);
  const [catInputs, setCatInputs] = useState({});
  const [savingCat, setSavingCat] = useState({});

  const fetchBudgetStatus = async () => {
    setLoading(true);
    try {
      const data = await budgetsApi.getStatus(month);
      setBudgetStatus(data);
    } catch { setBudgetStatus(null); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchBudgetStatus(); }, [month]);

  const overallBudget = budgetStatus?.find?.(b => !b.categoryId) ?? null;
  const categoryBudgets = (budgetStatus || []).filter(b => b.categoryId);

  const handleSaveOverall = async () => {
    if (!overallInput) return;
    setSavingOverall(true);
    await updatePersonalBudget(overallInput, null);
    setOverallInput('');
    await fetchBudgetStatus();
    setSavingOverall(false);
  };

  const handleSaveCat = async (catId) => {
    const val = catInputs[catId];
    if (!val) return;
    setSavingCat(p => ({ ...p, [catId]: true }));
    await updatePersonalBudget(val, catId);
    setCatInputs(p => { const n = { ...p }; delete n[catId]; return n; });
    await fetchBudgetStatus();
    setSavingCat(p => ({ ...p, [catId]: false }));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Header */}
      <div className="card" style={{ padding: '22px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span className="badge" style={{ background: '#050505', color: '#B7FF00' }}><Target size={11} /> Personal Budgets</span>
            </div>
            <h2 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', marginBottom: '4px', fontWeight: 800 }}>Budget Settings</h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Set monthly spending limits. Alerts fire at 80% (Warning) and 100% (Exceeded).
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <select
              value={month}
              onChange={e => setMonth(e.target.value)}
              className="input-field"
              style={{ paddingRight: '30px', fontSize: '0.83rem', cursor: 'pointer', borderRadius: 'var(--r-md)' }}
            >
              {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
            <button className="btn btn-secondary btn-sm" onClick={fetchBudgetStatus} title="Refresh">
              <RefreshCw size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Overall Budget Card */}
      <div className="card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)', fontWeight: 700, marginBottom: '2px' }}>Overall Monthly Limit</h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Global cap across all categories for {month}
            </p>
          </div>
          {overallBudget && (
            <span style={{
              padding: '4px 12px', borderRadius: '99px', fontSize: '0.78rem', fontWeight: 700,
              background: `${statusColor(overallBudget.status)}15`,
              color: statusColor(overallBudget.status),
            }}>
              {statusLabel(overallBudget.status)}
            </span>
          )}
        </div>

        {loading ? (
          <>
            <div className="skeleton" style={{ height: '8px', width: '100%', marginBottom: '12px' }} />
            <div className="skeleton" style={{ height: '14px', width: '60%', marginBottom: '16px' }} />
          </>
        ) : overallBudget ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                ₹{(overallBudget.spent || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })} spent
              </span>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                of ₹{(overallBudget.budgetLimit || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })} limit
              </span>
            </div>
            <div className="progress-track" style={{ height: '8px', marginBottom: '10px' }}>
              <div className="progress-fill" style={{
                width: `${Math.min(overallBudget.percentUsed || 0, 100)}%`,
                background: statusColor(overallBudget.status),
              }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              <span>{(overallBudget.percentUsed || 0).toFixed(1)}% used</span>
              <span>₹{(overallBudget.remaining || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })} remaining</span>
            </div>
          </>
        ) : (
          <div style={{
            padding: '16px', borderRadius: 'var(--r-md)',
            background: 'var(--bg-surface)', border: '1px dashed var(--border)',
            textAlign: 'center', marginBottom: '16px',
          }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No overall budget set for {month}.</p>
          </div>
        )}

        <div style={{ display: 'flex', gap: '8px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint)', fontSize: '0.9rem', fontWeight: 700 }}>₹</span>
            <input
              type="number" step="100" placeholder={overallBudget ? `Update limit (current: ₹${overallBudget.budgetLimit})` : 'Enter monthly limit...'}
              value={overallInput} onChange={e => setOverallInput(e.target.value)}
              className="input-field" style={{ paddingLeft: '28px', fontSize: '0.875rem' }}
            />
          </div>
          <button className="btn btn-primary" onClick={handleSaveOverall} disabled={savingOverall || !overallInput}>
            {savingOverall ? <Loader2 size={15} style={{ animation: 'spin 0.7s linear infinite' }} /> : <Target size={15} />}
            {overallBudget ? 'Update' : 'Set Limit'}
          </button>
        </div>
      </div>

      {/* Category Budgets */}
      <div className="card" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)', fontWeight: 700, marginBottom: '6px' }}>Category Budget Caps</h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '20px' }}>Set per-category spending limits for {month}.</p>

        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ marginBottom: '16px' }}>
              <div className="skeleton" style={{ height: '14px', width: '40%', marginBottom: '6px' }} />
              <div className="skeleton" style={{ height: '8px', width: '100%', marginBottom: '8px' }} />
              <div className="skeleton" style={{ height: '38px', width: '100%', borderRadius: '8px' }} />
            </div>
          ))
        ) : (
          categories.map(cat => {
            const catBudget = categoryBudgets.find(b => b.categoryId === cat.id);
            const pct = catBudget?.percentUsed || 0;
            return (
              <div key={cat.id} style={{
                marginBottom: '14px', padding: '14px 16px', borderRadius: 'var(--r-lg)',
                background: 'var(--bg-surface)', border: '1px solid var(--border)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CategoryIcon icon={cat.icon} size={16} color={cat.color || '#737373'} />
                    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>{cat.name}</span>
                  </div>
                  {catBudget ? (
                    <span style={{ fontSize: '0.75rem', color: statusColor(catBudget.status), fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <StatusIcon status={catBudget.status} />
                      {catBudget.percentUsed?.toFixed(0)}% · {statusLabel(catBudget.status)}
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-faint)' }}>No limit</span>
                  )}
                </div>

                {catBudget && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      <span>₹{(catBudget.spent || 0).toFixed(2)} spent</span>
                      <span>of ₹{catBudget.budgetLimit?.toFixed(2)}</span>
                    </div>
                    <div className="progress-track" style={{ height: '5px', marginBottom: '10px' }}>
                      <div className="progress-fill" style={{ width: `${Math.min(pct, 100)}%`, background: statusColor(catBudget.status) }} />
                    </div>
                  </>
                )}

                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="number" step="100"
                    placeholder={catBudget ? `Update: ₹${catBudget.budgetLimit}` : 'Set category limit (₹)'}
                    value={catInputs[cat.id] || ''}
                    onChange={e => setCatInputs(p => ({ ...p, [cat.id]: e.target.value }))}
                    className="input-field"
                    style={{ flex: 1, fontSize: '0.83rem' }}
                  />
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleSaveCat(cat.id)}
                    disabled={savingCat[cat.id] || !catInputs[cat.id]}
                    style={{ flexShrink: 0 }}
                  >
                    {savingCat[cat.id] ? <Loader2 size={14} style={{ animation: 'spin 0.7s linear infinite' }} /> : <Target size={14} />}
                    {catBudget ? 'Update' : 'Set'}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
